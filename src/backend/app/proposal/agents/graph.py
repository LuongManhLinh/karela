from dataclasses import dataclass, field
from typing import Literal, Optional
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, START, END
from langgraph.runtime import Runtime
from langchain.agents.middleware import dynamic_prompt, ModelRequest
from sqlalchemy.orm import Session


from llm.dynamic_agent import GenimiDynamicAgent
from .prompts import (
    DRAFTER_SYSTEM_PROMPT,
    IMPACT_ANALYZER_SYSTEM_PROMPT,
    REWRITER_SYSTEM_PROMPT,
    SIMPLE_SYSTEM_PROMPT,
)
from .schemas import (
    ProposalInput,
    ProposalOutput,
    Proposal,
    ImpactAnalyzerInput,
    ImpactAnalyzerOutput,
    ProposalReview,
    RewriterInput,
)
from app.analysis.agents.schemas import UserStoryMinimal, DefectByLlm
from common.agents.schemas import LlmContext
from common.configs import LlmConfig
from app.documentation.llm_tools import doc_tools
from .fake_history import (
    DRAFTER_FAKE_HISTORY,
    IMPACT_ANALYZER_FAKE_HISTORY,
    REWRITER_FAKE_HISTORY,
)


def get_dynamic_prompt_middleware_for_node(node_name: str) -> str:
    @dynamic_prompt
    def user_context_prompt(request: ModelRequest) -> str:
        extra_instruction = request.runtime.context.extra_instruction or ""
        if node_name == "proposal_drafter":
            return DRAFTER_SYSTEM_PROMPT.format(extra_instruction=extra_instruction)
        elif node_name == "impact_analyzer":
            return IMPACT_ANALYZER_SYSTEM_PROMPT.format(
                extra_instruction=extra_instruction
            )
        elif node_name == "proposal_rewriter":
            return REWRITER_SYSTEM_PROMPT.format(extra_instruction=extra_instruction)
        elif node_name == "simple_agent":
            return SIMPLE_SYSTEM_PROMPT.format(extra_instruction=extra_instruction)
        else:
            return ""

    return user_context_prompt


# Create agents for each node
drafter_agent = GenimiDynamicAgent(
    model_name=LlmConfig.GEMINI_DEFECT_MODEL,
    temperature=LlmConfig.LLM_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=ProposalOutput,
    api_keys=LlmConfig.GEMINI_API_KEYS,
    max_retries=LlmConfig.GEMINI_API_MAX_RETRY,
    middleware=[get_dynamic_prompt_middleware_for_node("proposal_drafter")],
    tools=doc_tools,
)

impact_analyzer_agent = GenimiDynamicAgent(
    model_name=LlmConfig.GEMINI_DEFECT_MODEL,
    temperature=LlmConfig.LLM_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=ImpactAnalyzerOutput,
    api_keys=LlmConfig.GEMINI_API_KEYS,
    max_retries=LlmConfig.GEMINI_API_MAX_RETRY,
    middleware=[get_dynamic_prompt_middleware_for_node("impact_analyzer")],
    tools=doc_tools,
)

rewriter_agent = GenimiDynamicAgent(
    model_name=LlmConfig.GEMINI_DEFECT_MODEL,
    temperature=LlmConfig.LLM_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=ProposalOutput,
    api_keys=LlmConfig.GEMINI_API_KEYS,
    max_retries=LlmConfig.GEMINI_API_MAX_RETRY,
    middleware=[get_dynamic_prompt_middleware_for_node("proposal_rewriter")],
    tools=doc_tools,
)

simple_agent = GenimiDynamicAgent(
    model_name=LlmConfig.GEMINI_DEFECT_MODEL,
    temperature=LlmConfig.LLM_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=ProposalOutput,
    api_keys=LlmConfig.GEMINI_API_KEYS,
    max_retries=LlmConfig.GEMINI_API_MAX_RETRY,
    middleware=[get_dynamic_prompt_middleware_for_node("simple_agent")],
    tools=doc_tools,
)


@dataclass
class State:
    """State for the proposal generation workflow."""

    proposals: list[Proposal] = field(default_factory=list)
    reviews: list[ProposalReview] = field(default_factory=list)
    rewrite_attempt: int = 0
    max_rewrite_attempts: int = 3
    is_complete: bool = False
    # Store messages of the rewrite loop (Human request + AI response)
    loop_history: list[BaseMessage] = field(default_factory=list)
    extra_instruction: Optional[str] = None


class Context(LlmContext):
    """Context shared across all nodes."""

    user_stories: list[UserStoryMinimal]
    defects: list[DefectByLlm]
    initial_messages: Optional[list[BaseMessage]] = None
    extra_instruction: Optional[str] = None
    clarifications: Optional[str] = None


def proposal_drafter(state: State, runtime: Runtime[Context]) -> State:
    """Node A: Draft initial proposals based on defects."""
    print("Executing Proposal Drafter Node")
    context = runtime.context

    proposal_input = ProposalInput(
        user_stories=context.user_stories,
        defects=context.defects,
    )

    clarifications = context.clarifications

    human_message = f"Here is the input data for generating proposals:\n{proposal_input.model_dump_json(indent=2)}"

    if clarifications:
        human_message += f"\n\nClarifications:\n{clarifications}"

    messages = DRAFTER_FAKE_HISTORY + [HumanMessage(content=human_message)]

    initial_messages = runtime.context.initial_messages
    if initial_messages:
        messages = initial_messages + messages

    response = drafter_agent.invoke(messages=messages)

    proposals = response["structured_response"].proposals
    state.proposals = proposals
    print(f"Drafted {len(proposals)} proposals.")
    return state


def impact_analyzer(state: State, runtime: Runtime[Context]) -> State:
    """Node B: Analyze proposals for safety, regression risks, and compliance."""
    print("Executing Impact Analyzer Node")
    context = runtime.context

    analyzer_input = ImpactAnalyzerInput(
        user_stories=context.user_stories,
        defects=context.defects,
        proposals=state.proposals,
    )

    human_message = (
        f"Please review these proposals:\n{analyzer_input.model_dump_json(indent=2)}"
    )
    clarifications = context.clarifications
    if clarifications:
        human_message += f"\n\nClarifications:\n{clarifications}"
    messages = IMPACT_ANALYZER_FAKE_HISTORY + [HumanMessage(content=human_message)]

    initial_messages = runtime.context.initial_messages
    if initial_messages:
        messages = initial_messages + messages

    response = impact_analyzer_agent.invoke(messages=messages)

    reviews = response["structured_response"].reviews
    state.reviews = reviews

    # Check if all proposals are approved or max attempts reached
    all_approved = all(review.status == "APPROVE" for review in reviews)
    max_attempts_reached = state.rewrite_attempt >= state.max_rewrite_attempts

    if all_approved or max_attempts_reached:
        state.is_complete = True
        # If max attempts reached, filter out rejected proposals
        if max_attempts_reached and not all_approved:
            approved_indices = {
                review.proposal_index
                for review in reviews
                if review.status == "APPROVE"
            }
            state.proposals = [
                p for i, p in enumerate(state.proposals) if i in approved_indices
            ]
    print(
        f"Impact analysis completed. Approved proposals: {sum(1 for r in reviews if r.status == 'APPROVE')}/{len(reviews)}"
    )

    return state


def proposal_rewriter(state: State, runtime: Runtime[Context]) -> State:
    """Node C: Rewrite proposals based on impact analyzer feedback."""
    print("Executing Proposal Rewriter Node")
    context = runtime.context

    # Filter feedback for proposals that need rewriting
    rewrite_feedback = [
        review for review in state.reviews if review.status in ["REWRITE", "REJECT"]
    ]

    rewriter_input = RewriterInput(
        user_stories=context.user_stories,
        defects=context.defects,
        original_proposals=state.proposals,
        feedback=rewrite_feedback,
    )

    human_message = f"Please rewrite the proposals based on this feedback:\n{rewriter_input.model_dump_json(indent=2)}"
    clarifications = context.clarifications
    if clarifications:
        human_message += f"\n\nClarifications:\n{clarifications}"

    current_message = HumanMessage(content=human_message)

    # Combine Few-Shot + Loop History + Current Request
    messages = REWRITER_FAKE_HISTORY + state.loop_history + [current_message]

    initial_messages = runtime.context.initial_messages
    if initial_messages:
        messages = initial_messages + messages

    response = rewriter_agent.invoke(messages=messages)

    # Store the result for history of next iteration
    # Using model_dump_json of the output to simulate AIMessage content
    ai_response_message = AIMessage(
        content=response["structured_response"].model_dump_json(indent=2)
    )

    state.loop_history.extend([current_message, ai_response_message])

    # Update proposals with rewritten versions
    rewritten_proposals = response["structured_response"].proposals
    state.proposals = rewritten_proposals
    state.rewrite_attempt += 1

    print(
        f"Rewriting completed. Rewrite attempt #{state.rewrite_attempt}. Number of proposals: {len(rewritten_proposals)}"
    )

    return state


def should_continue(state: State) -> str:
    """Conditional edge from impact_analyzer."""
    if state.is_complete:
        return "end"
    else:
        return "rewriter"


def build_graph() -> StateGraph:
    """Build the LangGraph workflow."""
    workflow = StateGraph(State, context=Context)

    # Add nodes
    workflow.add_node("proposal_drafter", proposal_drafter)
    workflow.add_node("impact_analyzer", impact_analyzer)
    workflow.add_node("proposal_rewriter", proposal_rewriter)

    # Add edges
    workflow.add_edge(START, "proposal_drafter")
    workflow.add_edge("proposal_drafter", "impact_analyzer")
    workflow.add_conditional_edges(
        "impact_analyzer",
        should_continue,
        {"end": END, "rewriter": "proposal_rewriter"},
    )
    workflow.add_edge("proposal_rewriter", "impact_analyzer")

    return workflow.compile()


_graph = build_graph()


def generate_proposals(
    mode: Literal["SIMPLE", "COMPLEX"],
    user_stories: list[UserStoryMinimal],
    defects: list[DefectByLlm],
    db: Session,
    connection_id: str,
    project_key: str,
    max_rewrite_attempts: int = 3,
    extra_instruction: Optional[str] = None,
    initial_messages: Optional[list[BaseMessage]] = None,
    clarifications: Optional[str] = None,
) -> list[Proposal]:
    """
    Generate Jira proposal improvements from existing defects.

    Args:
        user_stories: List of existing user stories
        defects: List of identified defects
        max_rewrite_attempts: Maximum number of rewrite attempts before accepting partial results

    Returns:
        List of approved proposals
    """

    context = Context(
        user_stories=user_stories,
        defects=defects,
        extra_instruction=extra_instruction,
        connection_id=connection_id,
        project_key=project_key,
        db=db,
        initial_messages=initial_messages,
        clarifications=clarifications,
    )

    if mode == "COMPLEX":
        initial_state = State(max_rewrite_attempts=max_rewrite_attempts)

        final_state = _graph.invoke(initial_state, context=context)

        if isinstance(final_state, dict):
            return final_state.get("proposals", [])
        elif hasattr(final_state, "proposals"):
            return final_state.proposals
        else:
            return []
    else:
        # Simple mode: one-shot generation without analysis/rewriting loop
        simple_input = ProposalInput(
            user_stories=user_stories,
            defects=defects,
        )

        human_message = f"Here is the input data for generating proposals:\n{simple_input.model_dump_json(indent=2)}"
        if clarifications:
            human_message += f"\n\nClarifications:\n{clarifications}"

        messages = DRAFTER_FAKE_HISTORY + [HumanMessage(content=human_message)]

        if initial_messages:
            messages = initial_messages + messages

        response = simple_agent.invoke(messages=messages, context=context)
        proposals = response["structured_response"].proposals

        return proposals
