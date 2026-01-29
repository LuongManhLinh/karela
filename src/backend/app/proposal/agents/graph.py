from dataclasses import dataclass, field
from typing import List, Optional
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, START, END
from langgraph.runtime import Runtime


from llm.dynamic_agent import GenimiDynamicAgent
from .prompts import (
    DRAFTER_SYSTEM_PROMPT,
    IMPACT_ANALYZER_SYSTEM_PROMPT,
    REWRITER_SYSTEM_PROMPT,
)
from .schemas import (
    ProposalContextInput,
    ProposalInput,
    ProposalOutput,
    Proposal,
    ImpactAnalyzerInput,
    ImpactAnalyzerOutput,
    ProposalReview,
    RewriterInput,
)
from app.analysis.agents.schemas import WorkItemMinimal, DefectInput
from common.agents.input_schemas import ContextInput
from common.configs import GeminiConfig
from .fake_history import (
    DRAFTER_FAKE_HISTORY,
    IMPACT_ANALYZER_FAKE_HISTORY,
    REWRITER_FAKE_HISTORY,
)


# Create agents for each node
drafter_agent = GenimiDynamicAgent(
    system_prompt=DRAFTER_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=ProposalOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
)

impact_analyzer_agent = GenimiDynamicAgent(
    system_prompt=IMPACT_ANALYZER_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=ImpactAnalyzerOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
)

rewriter_agent = GenimiDynamicAgent(
    system_prompt=REWRITER_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_DEFECT_MODEL,
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=ProposalOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
)


@dataclass
class State:
    """State for the proposal generation workflow."""

    proposals: List[Proposal] = field(default_factory=list)
    reviews: List[ProposalReview] = field(default_factory=list)
    rewrite_attempt: int = 0
    max_rewrite_attempts: int = 3
    is_complete: bool = False
    # Store messages of the rewrite loop (Human request + AI response)
    loop_history: List[BaseMessage] = field(default_factory=list)


@dataclass
class Context:
    """Context shared across all nodes."""

    user_stories: List[WorkItemMinimal]
    defects: List[DefectInput]
    context_input: Optional[ContextInput] = None


def proposal_drafter(state: State, runtime: Runtime[Context]) -> State:
    """Node A: Draft initial proposals based on defects."""
    print("Executing Proposal Drafter Node")
    user_stories = runtime.context.user_stories
    defects = runtime.context.defects
    context_input = runtime.context.context_input

    proposal_input = ProposalInput(
        user_stories=user_stories,
        defects=defects,
        context_input=context_input,
    )

    messages = DRAFTER_FAKE_HISTORY + [
        HumanMessage(
            content=f"Here is the input data for generating proposals:\n{proposal_input.model_dump_json(indent=2)}"
        )
    ]

    response = drafter_agent.invoke(messages=messages)

    proposals = response["structured_response"].proposals
    state.proposals = proposals
    print(f"Drafted {len(proposals)} proposals.")
    return state


def impact_analyzer(state: State, runtime: Runtime[Context]) -> State:
    """Node B: Analyze proposals for safety, regression risks, and compliance."""
    print("Executing Impact Analyzer Node")
    user_stories = runtime.context.user_stories
    defects = runtime.context.defects
    context_input = runtime.context.context_input

    analyzer_input = ImpactAnalyzerInput(
        user_stories=user_stories,
        defects=defects,
        proposals=state.proposals,
        context_input=context_input,
    )

    messages = IMPACT_ANALYZER_FAKE_HISTORY + [
        HumanMessage(
            content=f"Please review these proposals:\n{analyzer_input.model_dump_json(indent=2)}"
        )
    ]

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
    user_stories = runtime.context.user_stories
    defects = runtime.context.defects
    context_input = runtime.context.context_input

    # Filter feedback for proposals that need rewriting
    rewrite_feedback = [
        review for review in state.reviews if review.status in ["REWRITE", "REJECT"]
    ]

    rewriter_input = RewriterInput(
        user_stories=user_stories,
        defects=defects,
        original_proposals=state.proposals,
        feedback=rewrite_feedback,
        context_input=context_input,
    )

    current_message = HumanMessage(
        content=f"Please rewrite the proposals based on this feedback:\n{rewriter_input.model_dump_json(indent=2)}"
    )

    # Combine Few-Shot + Loop History + Current Request
    messages = REWRITER_FAKE_HISTORY + state.loop_history + [current_message]

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
    user_stories: List[WorkItemMinimal],
    defects: List[DefectInput],
    context_input: ContextInput | ProposalContextInput = None,
    max_rewrite_attempts: int = 3,
) -> List[Proposal]:
    """
    Generate Jira proposal improvements from existing defects.

    Args:
        user_stories: List of existing user stories
        defects: List of identified defects
        context_input: Optional contextual information (documentation, style guide)
        max_rewrite_attempts: Maximum number of rewrite attempts before accepting partial results

    Returns:
        List of approved proposals
    """

    initial_state = State(max_rewrite_attempts=max_rewrite_attempts)
    context = Context(
        user_stories=user_stories,
        defects=defects,
        context_input=context_input,
    )

    final_state = _graph.invoke(initial_state, context=context)

    if isinstance(final_state, dict):
        return final_state.get("proposals", [])
    elif hasattr(final_state, "proposals"):
        return final_state.proposals
    else:
        return []
