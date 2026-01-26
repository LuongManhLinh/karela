from dataclasses import dataclass, field
from typing import List, Optional
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, START, END
from langgraph.runtime import Runtime

from llm.dynamic_agent import GenimiDynamicAgent
from common.agents.input_schemas import ContextInput
from common.configs import GeminiConfig

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


# Create agents for each node
ac_generator_agent = GenimiDynamicAgent(
    system_prompt=AC_GENERATOR_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_CHAT_MODEL,
    temperature=GeminiConfig.GEMINI_API_CHAT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=ACGeneratorOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
)

ac_reviewer_agent = GenimiDynamicAgent(
    system_prompt=AC_REVIEWER_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_CHAT_MODEL,
    temperature=GeminiConfig.GEMINI_API_DEFECT_TEMPERATURE,  # Use lower temp for critique
    response_mime_type="application/json",
    response_schema=ACReviewerOutput,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
)

ac_rewriter_agent = GenimiDynamicAgent(
    system_prompt=AC_REWRITER_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_CHAT_MODEL,
    temperature=GeminiConfig.GEMINI_API_CHAT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=ACGeneratorOutput,  # Re-use generator output schema
    api_keys=GeminiConfig.GEMINI_API_KEYS,
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
    loop_history: List[BaseMessage] = field(default_factory=list)


@dataclass
class Context:
    """Context shared across all nodes."""

    summary: str
    description: str
    existing_ac: Optional[str] = None
    user_feedback: Optional[str] = None
    context_input: Optional[ContextInput] = None


def ac_generator(state: State, runtime: Runtime[Context]) -> State:
    """Node: Generate initial AC."""
    print("Executing AC Generator Node")

    input_data = ACGeneratorInput(
        summary=runtime.context.summary,
        description=runtime.context.description,
        existing_ac=runtime.context.existing_ac,
        user_feedback=runtime.context.user_feedback,
        context_input=runtime.context.context_input,
    )

    messages = AC_GENERATOR_FAKE_HISTORY + [
        HumanMessage(
            content=f"Here is the input for generating AC:\n{input_data.model_dump_json(indent=2)}"
        )
    ]

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
        context_input=runtime.context.context_input,
    )

    messages = AC_REVIEWER_FAKE_HISTORY + [
        HumanMessage(
            content=f"Please review this AC:\n{input_data.model_dump_json(indent=2)}"
        )
    ]

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
        context_input=runtime.context.context_input,
        current_ac=state.generated_ac,
        reviewer_feedback=state.review.feedback or "Please improve the AC.",
    )

    current_message = HumanMessage(
        content=f"Please rewrite the AC based on this feedback:\n{input_data.model_dump_json(indent=2)}"
    )

    messages = AC_REWRITER_FAKE_HISTORY + state.loop_history + [current_message]

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
    existing_ac: Optional[str] = None,
    feedback: Optional[str] = None,
    context: Optional[ContextInput] = None,
    max_rewrite_attempts: int = 3,
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
        context_input=context,
    )

    final_state = _graph.invoke(initial_state, context=context_data)

    if isinstance(final_state, dict):
        return final_state.get("generated_ac", "")
    elif hasattr(final_state, "generated_ac"):
        return final_state.generated_ac
    else:
        return ""
