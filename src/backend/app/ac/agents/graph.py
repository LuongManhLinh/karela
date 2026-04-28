from dataclasses import dataclass, field
from typing import List, Optional
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, START, END
from langgraph.runtime import Runtime
from sqlalchemy.orm import Session

from llm.dynamic_agent import GenimiDynamicAgent
from common.configs import LlmConfig
from common.agents.schemas import LlmContext
from app.documentation.llm_tools import doc_tools as doc_tools
from langchain.agents.middleware import dynamic_prompt, ModelRequest

from .prompts import (
    AC_GENERATOR_SYSTEM_PROMPT,
    AC_REVIEWER_SYSTEM_PROMPT,
    AC_REWRITER_SYSTEM_PROMPT,
)

from .schemas import (
    ACGeneratorInput,
    ACGeneratorOutput,
    ACReviewerInput,
    ACReviewerOutput,
    ACRewriterInput,
    ACReview,
)

from .fake_history import (
    AC_GENERATOR_FAKE_HISTORY,
    AC_REVIEWER_FAKE_HISTORY,
    AC_REWRITER_FAKE_HISTORY,
)


def get_dynamic_prompt_middleware_for_node(node_name: str) -> str:
    @dynamic_prompt
    def user_context_prompt(request: ModelRequest) -> str:
        extra_instruction = request.runtime.context.extra_instruction or ""
        if node_name == "ac_generator":
            return AC_GENERATOR_SYSTEM_PROMPT.format(
                extra_instruction=extra_instruction
            )
        elif node_name == "ac_reviewer":
            return AC_REVIEWER_SYSTEM_PROMPT.format(extra_instruction=extra_instruction)
        elif node_name == "ac_rewriter":
            return AC_REWRITER_SYSTEM_PROMPT.format(extra_instruction=extra_instruction)
        else:
            return ""

    return user_context_prompt


# Create agents for each node
ac_generator_agent = GenimiDynamicAgent(
    model_name=LlmConfig.GEMINI_CHAT_MODEL,
    temperature=LlmConfig.LLM_CHAT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=ACGeneratorOutput,
    api_keys=LlmConfig.GEMINI_API_KEYS,
    tools=doc_tools,
    middleware=[get_dynamic_prompt_middleware_for_node("ac_generator")],
)

ac_reviewer_agent = GenimiDynamicAgent(
    model_name=LlmConfig.GEMINI_CHAT_MODEL,
    temperature=LlmConfig.LLM_DEFECT_TEMPERATURE,  # Use lower temp for critique
    response_mime_type="application/json",
    response_schema=ACReviewerOutput,
    api_keys=LlmConfig.GEMINI_API_KEYS,
    tools=doc_tools,
    middleware=[get_dynamic_prompt_middleware_for_node("ac_reviewer")],
)

ac_rewriter_agent = GenimiDynamicAgent(
    model_name=LlmConfig.GEMINI_CHAT_MODEL,
    temperature=LlmConfig.LLM_CHAT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=ACGeneratorOutput,  # Re-use generator output schema
    api_keys=LlmConfig.GEMINI_API_KEYS,
    tools=doc_tools,
    middleware=[get_dynamic_prompt_middleware_for_node("ac_rewriter")],
)


@dataclass
class State:
    """State for the AC generation workflow."""

    generated_ac: Optional[str] = None
    reasoning: Optional[str] = None
    review: Optional[ACReview] = None
    rewrite_attempt: int = 0
    max_rewrite_attempts: int = 3
    is_complete: bool = False
    # Store messages of the rewrite loop
    loop_history: list[BaseMessage] = field(default_factory=list)


class Context(LlmContext):
    """Context shared across all nodes."""

    summary: str
    description: str
    existing_ac: Optional[str] = None
    user_feedback: Optional[str] = None
    initial_messages: Optional[list[BaseMessage]] = None
    extra_instruction: Optional[str] = None


def ac_generator(state: State, runtime: Runtime[Context]) -> State:
    """Node: Generate initial AC."""
    print("Executing AC Generator Node")

    input_data = ACGeneratorInput(
        summary=runtime.context.summary,
        description=runtime.context.description,
        existing_ac=runtime.context.existing_ac,
        user_feedback=runtime.context.user_feedback,
    )

    messages = AC_GENERATOR_FAKE_HISTORY + [
        HumanMessage(
            content=f"Here is the input for generating AC:\n{input_data.model_dump_json(indent=2)}"
        )
    ]

    init_messages = runtime.context.initial_messages
    if init_messages:
        messages = init_messages + messages

    response = ac_generator_agent.invoke(messages=messages)
    structured_response = response["structured_response"]

    state.generated_ac = structured_response.gherkin_ac
    state.reasoning = structured_response.reasoning
    print("AC Generated.")
    return state


def ac_reviewer(state: State, runtime: Runtime[Context]) -> State:
    """Node: Review the generated AC."""
    print("Executing AC Reviewer Node")

    input_data = ACReviewerInput(
        user_story_title=runtime.context.summary,
        user_story_description=runtime.context.description,
        generated_ac=state.generated_ac,
    )

    messages = AC_REVIEWER_FAKE_HISTORY + [
        HumanMessage(
            content=f"Please review this AC:\n{input_data.model_dump_json(indent=2)}"
        )
    ]

    init_messages = runtime.context.initial_messages
    if init_messages:
        messages = init_messages + messages

    response = ac_reviewer_agent.invoke(messages=messages)
    structured_response = response["structured_response"]

    state.review = structured_response.review

    if (
        state.review.status == "APPROVE"
        or state.rewrite_attempt >= state.max_rewrite_attempts
    ):
        state.is_complete = True
        print(
            f"Review completed. Status: {state.review.status} (Attempts: {state.rewrite_attempt})"
        )
    else:
        print(f"Review completed. Status: {state.review.status}. Sending for rewrite.")

    return state


def ac_rewriter(state: State, runtime: Runtime[Context]) -> State:
    """Node: Rewrite AC based on feedback."""
    print("Executing AC Rewriter Node")

    input_data = ACRewriterInput(
        summary=runtime.context.summary,
        description=runtime.context.description,
        existing_ac=runtime.context.existing_ac,
        user_feedback=runtime.context.user_feedback,
        current_ac=state.generated_ac,
        reviewer_feedback=state.review.feedback or "Please improve the AC.",
    )

    current_message = HumanMessage(
        content=f"Please rewrite the AC based on this feedback:\n{input_data.model_dump_json(indent=2)}"
    )

    messages = AC_REWRITER_FAKE_HISTORY + state.loop_history + [current_message]
    init_messages = runtime.context.initial_messages
    if init_messages:
        messages = init_messages + messages

    response = ac_rewriter_agent.invoke(messages=messages)
    structured_response = response["structured_response"]

    state.generated_ac = structured_response.gherkin_ac
    state.reasoning = structured_response.reasoning
    state.rewrite_attempt += 1

    # Update loop history
    ai_response_message = AIMessage(
        content=structured_response.model_dump_json(indent=2)
    )
    state.loop_history.extend([current_message, ai_response_message])

    print(f"Rewriting completed. Attempt #{state.rewrite_attempt}")
    return state


def should_continue(state: State) -> str:
    """Conditional edge from reviewer."""
    if state.is_complete:
        return "end"
    else:
        return "rewriter"


def build_graph() -> StateGraph:
    """Build the LangGraph workflow."""
    workflow = StateGraph(State, context=Context)

    workflow.add_node("ac_generator", ac_generator)
    # workflow.add_node("ac_reviewer", ac_reviewer)
    # workflow.add_node("ac_rewriter", ac_rewriter)

    workflow.add_edge(START, "ac_generator")
    workflow.add_edge("ac_generator", END)
    # workflow.add_edge("ac_generator", "ac_reviewer")

    # workflow.add_conditional_edges(
    #     "ac_reviewer",
    #     should_continue,
    #     {"end": END, "rewriter": "ac_rewriter"},
    # )

    # workflow.add_edge("ac_rewriter", "ac_reviewer")

    return workflow.compile()


_graph = build_graph()


def generate_ac_from_story(
    summary: str,
    description: str,
    db: Session,
    connection_id: str,
    project_key: str,
    existing_ac: Optional[str] = None,
    feedback: Optional[str] = None,
    max_rewrite_attempts: int = 3,
    extra_instruction: Optional[str] = None,
    initial_messages: Optional[list[BaseMessage]] = None,
) -> str:
    """
    Generates Gherkin Acceptance Criteria from a User Story title and description.
    """

    initial_state = State(max_rewrite_attempts=max_rewrite_attempts)
    context_data = Context(
        summary=summary,
        description=description,
        existing_ac=existing_ac,
        user_feedback=feedback,
        connection_id=connection_id,
        project_key=project_key,
        db=db,
        initial_messages=initial_messages,
        extra_instruction=extra_instruction,
    )

    final_state = _graph.invoke(initial_state, context=context_data)

    if isinstance(final_state, dict):
        return final_state.get("generated_ac", "")
    elif hasattr(final_state, "generated_ac"):
        return final_state.generated_ac
    else:
        return ""
