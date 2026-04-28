from dataclasses import dataclass
from typing import Optional
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from langgraph.runtime import Runtime
from langchain.agents.middleware import dynamic_prompt, ModelRequest

from llm.dynamic_agent import GenimiDynamicAgent
from common.configs import LlmConfig
from .prompts import SELF_DEFECT_SYSTEM_PROMPT, PAIRWISE_DEFECT_SYSTEM_PROMPT
from .schemas import SingleDefectResponse, PairwiseDefectResponse
from .context_builder import build_llm_contexts_all, build_llm_contexts_targeted


def get_dynamic_prompt_middleware_for_node(node_name: str) -> str:
    @dynamic_prompt
    def user_context_prompt(request: ModelRequest) -> str:
        extra_instruction = request.runtime.context.extra_instruction or ""
        if node_name == "self_defect":
            return SELF_DEFECT_SYSTEM_PROMPT.format(extra_instruction=extra_instruction)
        elif node_name == "pairwise_defect":
            return PAIRWISE_DEFECT_SYSTEM_PROMPT.format(
                extra_instruction=extra_instruction
            )
        else:
            return ""

    return user_context_prompt


self_defect_agent = GenimiDynamicAgent(
    model_name=LlmConfig.GEMINI_DEFECT_MODEL,
    temperature=LlmConfig.LLM_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=SingleDefectResponse,
    api_keys=LlmConfig.GEMINI_API_KEYS,
    max_retries=LlmConfig.GEMINI_API_MAX_RETRY,
    middleware=[get_dynamic_prompt_middleware_for_node("self_defect")],
)

pairwise_defect_agent = GenimiDynamicAgent(
    model_name=LlmConfig.GEMINI_DEFECT_MODEL,
    temperature=LlmConfig.LLM_DEFECT_TEMPERATURE,
    response_mime_type="application/json",
    response_schema=PairwiseDefectResponse,
    api_keys=LlmConfig.GEMINI_API_KEYS,
    max_retries=LlmConfig.GEMINI_API_MAX_RETRY,
    middleware=[get_dynamic_prompt_middleware_for_node("pairwise_defect")],
)


@dataclass
class State:
    """State for the analysis defect detection workflow."""

    self_defect_context: str = ""
    pairwise_defect_context: str = ""
    self_defect_response: Optional[SingleDefectResponse] = None
    pairwise_defect_response: Optional[PairwiseDefectResponse] = None
    extra_instruction: Optional[str] = None


@dataclass
class Context:
    """Context shared across all nodes."""

    connection_id: str
    project_key: str
    target_titles: Optional[list[str]] = None
    extra_instruction: Optional[str] = None


def context_builder_all(state: State, runtime: Runtime[Context]) -> State:
    """Build LLM context using all queries (no filtering)."""
    print("Executing Context Builder (all) Node")
    context = runtime.context

    self_defect_context, pairwise_defect_context = build_llm_contexts_all(
        connection_id=context.connection_id,
        project_key=context.project_key,
    )

    state.self_defect_context = self_defect_context
    state.pairwise_defect_context = pairwise_defect_context
    # Save to a file for debugging
    with open("self_defect_context.txt", "w") as f:
        f.write(self_defect_context)
    with open("pairwise_defect_context.txt", "w") as f:
        f.write(pairwise_defect_context)
    print(
        "Saved generated contexts to self_defect_context.txt and pairwise_defect_context.txt"
    )
    return state


def context_builder_targeted(state: State, runtime: Runtime[Context]) -> State:
    """Build LLM context using targeted queries (filtered by target_titles)."""
    print("Executing Context Builder (targeted) Node")
    context = runtime.context

    self_defect_context, pairwise_defect_context = build_llm_contexts_targeted(
        connection_id=context.connection_id,
        project_key=context.project_key,
        target_titles=context.target_titles,
    )

    state.self_defect_context = self_defect_context
    state.pairwise_defect_context = pairwise_defect_context
    print(
        f"Context built (targeted). Self context length: {len(self_defect_context)}, "
        f"Pairwise context length: {len(pairwise_defect_context)}"
    )
    return state


def self_defect_node(state: State, runtime: Runtime[Context]) -> State:
    """Run the self-defect agent to validate single-story defects."""
    print("Executing Self Defect Agent Node")

    messages = [HumanMessage(content=state.self_defect_context)]

    response = self_defect_agent.invoke(messages=messages, context=runtime.context)

    state.self_defect_response = response["structured_response"]
    print(
        f"Self defect analysis completed. "
        f"Found {len(state.self_defect_response.valid_defects)} valid defect cases."
    )
    return state


def pairwise_defect_node(state: State, runtime: Runtime[Context]) -> State:
    """Run the pairwise-defect agent to validate cross-story defects."""
    print("Executing Pairwise Defect Agent Node")

    messages = [HumanMessage(content=state.pairwise_defect_context)]

    response = pairwise_defect_agent.invoke(messages=messages, context=runtime.context)

    state.pairwise_defect_response = response["structured_response"]
    print(
        f"Pairwise defect analysis completed. "
        f"Found {len(state.pairwise_defect_response.valid_defects)} valid defect cases."
    )
    return state


def _build_analysis_graph(
    context_builder_fn,
) -> StateGraph:
    """Build the LangGraph workflow for defect analysis.

    The workflow:
    1. context_builder: builds self and pairwise defect contexts
    2. self_defect_node + pairwise_defect_node: run concurrently
    3. END
    """
    workflow = StateGraph(State, context=Context)

    # Add nodes
    workflow.add_node("context_builder", context_builder_fn)
    # workflow.add_node("self_defect", self_defect_node)
    # workflow.add_node("pairwise_defect", pairwise_defect_node)

    # Add edges: START -> context_builder -> [self_defect, pairwise_defect] -> END
    workflow.add_edge(START, "context_builder")
    workflow.add_edge("context_builder", END)
    # workflow.add_edge("context_builder", "self_defect")
    # workflow.add_edge("context_builder", "pairwise_defect")
    # workflow.add_edge("self_defect", END)
    # workflow.add_edge("pairwise_defect", END)

    return workflow.compile()


_graph_all = _build_analysis_graph(context_builder_all)
_graph_targeted = _build_analysis_graph(context_builder_targeted)


def run_analysis_all(
    connection_id: str,
    project_key: str,
    extra_instruction: Optional[str] = None,
) -> tuple[SingleDefectResponse, PairwiseDefectResponse]:
    """Run the full defect analysis workflow on all stories.

    Args:
        connection_id: The connection ID for Neo4j bucket.
        project_key: The Jira project key.
        extra_instruction: Optional extra instructions for the LLM agents.

    Returns:
        A tuple of (SingleDefectResponse, PairwiseDefectResponse).
    """
    context = Context(
        connection_id=connection_id,
        project_key=project_key,
        extra_instruction=extra_instruction,
    )

    initial_state = State(extra_instruction=extra_instruction)
    final_state = _graph_all.invoke(initial_state, context=context)

    if isinstance(final_state, dict):
        return (
            final_state.get("self_defect_response"),
            final_state.get("pairwise_defect_response"),
        )

    # raise for testing
    raise Exception("This is a test exception to check error handling in the workflow.")

    return (
        final_state.self_defect_response,
        final_state.pairwise_defect_response,
    )


def run_analysis_targeted(
    connection_id: str,
    project_key: str,
    target_titles: list[str],
    extra_instruction: Optional[str] = None,
) -> tuple[SingleDefectResponse, PairwiseDefectResponse]:
    """Run the targeted defect analysis workflow on specific stories.

    Args:
        connection_id: The connection ID for Neo4j bucket.
        project_key: The Jira project key.
        target_titles: List of story keys to analyze.
        extra_instruction: Optional extra instructions for the LLM agents.

    Returns:
        A tuple of (SingleDefectResponse, PairwiseDefectResponse).
    """
    context = Context(
        connection_id=connection_id,
        project_key=project_key,
        target_titles=target_titles,
        extra_instruction=extra_instruction,
    )

    initial_state = State(extra_instruction=extra_instruction)
    final_state = _graph_targeted.invoke(initial_state, context=context)

    if isinstance(final_state, dict):
        return (
            final_state.get("self_defect_response"),
            final_state.get("pairwise_defect_response"),
        )
    # raise for testing
    raise Exception("This is a test exception to check error handling in the workflow.")

    return (
        final_state.self_defect_response,
        final_state.pairwise_defect_response,
    )
