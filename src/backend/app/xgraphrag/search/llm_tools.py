from langchain.tools import tool, ToolRuntime
import json
from common.agents.schemas import LlmContext
from graphrag.query.structured_search.base import SearchResult
import asyncio

from ..defines import chat_model, tokenizer, text_embedder

from .global_search import global_search
from .local_search import local_search
from .drift_search import drift_search


def _search_result_to_json(result: SearchResult):
    payload = {"response": result.response, "context": result.context_text}
    return json.dumps(payload, indent=2)


@tool
def graphrag_local_search(
    query: str,
    runtime: ToolRuntime[LlmContext],
) -> str:
    """ONLY USE WHEN THE USER ASKS PRECISE, TICKET-CENTRIC QUESTIONS FOCUSED ON 1-3 SPECIFIC STORIES OR EPICS.

    Run GraphRAG Local Search for precise, ticket-centric retrieval.

    This mode is best when the user asks about specific User Stories (e.g., SCRUM-123),
    specific Epics, exact features, user roles, or direct dependencies of a component.
    Local Search first maps the query to top entities (like a specific ticket ID or action)
    via embeddings, then expands to neighboring relationships (e.g., "blocks", "implements"),
    and reads the exact Jira descriptions/acceptance criteria.

    It is optimized for focused answers grounded in fine-grained evidence and
    works well for questions like:
    - "What is the acceptance criteria for story SCRUM-101?"
    - "Which stories directly conflict with the Payment Gateway feature?"
    - "Who is the target role for the notification epic?"

    Use this when the user needs highly accurate details about 1-3 specific stories
    or components, prioritizing precision over broad coverage.

    Args:
        query: Natural-language query focusing on specific Agile entities.

    Returns:
            A JSON string with the GraphRAG local search result.
    """
    context = runtime.context
    result = asyncio.run(
        local_search(
            connection_id=context.connection_id,
            project_key=context.project_key,
            query=query,
            chat_model=chat_model,
            tokenizer=tokenizer,
            text_embedder=text_embedder,
            auto_prompt=True,
        )
    )

    return _search_result_to_json(result)


@tool
def graphrag_global_search(
    query: str,
    runtime: ToolRuntime[LlmContext],
    use_community_weights: bool = False,
) -> str:
    """ONLY USE WHEN THE USER ASKS BROAD ANALYTICAL QUESTIONS REQUIRING SYNTHESIS ACROSS MANY STORIES OR EPICS.

    Run GraphRAG Global Search for backlog-level synthesis and Epic/Sprint summaries.

    This mode is designed for broad analytical questions that span across dozens or
    hundreds of User Stories. Global Search uses a map-reduce strategy over community reports
    to aggregate information across the entire Agile project.

    It is strongest for generating Sprint reviews, summarizing all stories within a large Epic,
    detecting project-wide technical debt, or mapping out the overall business value.
    Works well for questions like:
    - "Summarize all the security-related stories in this project."
    - "What is the overall progress and main focus of the Checkout Epic?"
    - "What are the common technical dependencies across all current sprint tasks?"

    Use this when the user needs a high-level, synthesized overview of the backlog
    rather than the technical details of a single ticket.

    Args:
        query: Natural-language question spanning broad project/backlog context.
        use_community_weights: If True, include entity-driven community weighting
                    for ranking and emphasis.

    Returns:
            A JSON string with the GraphRAG global search result.
    """
    context = runtime.context
    result = asyncio.run(
        global_search(
            connection_id=context.connection_id,
            project_key=context.project_key,
            query=query,
            chat_model=chat_model,
            tokenizer=tokenizer,
            use_community_weights=use_community_weights,
            auto_prompt=True,
        )
    )
    return _search_result_to_json(result)


@tool
def graphrag_drift_search(
    query: str,
    runtime: ToolRuntime[LlmContext],
    reduce: bool = True,
) -> str:
    """ONLY USE WHEN THE USER ASKS INVESTIGATIVE QUESTIONS REQUIRING DEEP TRACING ACROSS STORIES, ACTIONS, SYSTEMS, AND RESOURCES.

    Run GraphRAG DRIFT Search for Impact Analysis and deep dependency tracing.

    DRIFT Search performs guided multi-step traversal, making it the perfect tool for
    exploratory queries and deep dependency tracking across the Agile workflow.
    Instead of a single pass, it follows latent links across stories, APIs, databases,
    and roles to build a comprehensive chain of impact.

    It is highly effective for investigative prompts, root-cause exploration, and
    "what-if" scenarios. Works exceptionally well for questions like:
    - "Impact Analysis: If we modify the User Auth API, trace down all the stories and frontend modules that will be affected."
    - "Trace the implementation steps from the 'Shopping Cart' Epic down to its underlying database resources."
    - "Why is the reporting feature blocked? Follow the dependency chain to find the root cause."

    Use this when the user is asking investigative questions that require tracing
    complex paths across multiple nodes (Stories -> Actions -> Systems -> Resources).

    Args:
            query: Exploratory natural-language query for dependency/impact analysis.
            conversation_turns: Optional chat history as a list of {"role", "content"}
                    turns to preserve thread continuity.
            reduce: If True, apply final reduction/summarization over drift steps.

    Returns:
            A JSON string with the GraphRAG DRIFT search result.
    """
    context = runtime.context
    result = asyncio.run(
        drift_search(
            connection_id=context.connection_id,
            project_key=context.project_key,
            query=query,
            chat_model=chat_model,
            tokenizer=tokenizer,
            text_embedder=text_embedder,
            reduce=reduce,
            auto_prompt=True,
        )
    )
    return _search_result_to_json(result)


graphrag_search_tools = [
    graphrag_local_search,
    graphrag_global_search,
    graphrag_drift_search,
]
