from langchain.tools import tool, ToolRuntime
from common.agents.schemas import LlmContext
import json

from .vectorstore import DocumentationVectorStore
from .services import DocumentationService


@tool
def list_available_docs(runtime: ToolRuntime[LlmContext]) -> str:
    """Lists all available documentation
    Returns:
        str: A JSON string containing the list of available documentation
    """
    context = runtime.context

    docs = DocumentationService(db=context.db).list_all_docs_for_project(
        connection_id=context.connection_id, project_key=context.project_key
    )
    return json.dumps({"docs": docs}, indent=2)


@tool
def search_in_docs(
    runtime: ToolRuntime[LlmContext],
    query: str,
    doc_key: str | None = None,
    where_headers: list[dict[str, str]] | None = None,
    k: int = 5,
    min_similarity: float | None = None,
) -> str:
    """Searches for relevant information in the documentation
    Args:
        query (str): The search query
        doc_key (str, optional): The key of the documentation to search in.
            If not provided, searches in all documentation. Defaults to None.
        where_headers (list[dict[str, str]], optional): A list of headers to
            filter the search results.
            Each header is a dictionary two keys: "level" (e.g., "#", "##") and "text" (the header text).
            For example [{"level": "#", "text": "Introduction"}, {"level": "##", "text": "Subheader"}].
            You can still provide `where_headers` without `doc_key` to filter across all documentation.
            If not provided, no header filtering is applied. Defaults to None.
        k (int, optional): The number of top results to return. Defaults to 5.
        min_similarity (float, optional): The minimum similarity score
            for results to be included.
            Should be between 0 and 1. If not provided, no minimum similarity filtering is applied. Defaults to None.
    Returns:
        str: A JSON string containing the search results
    """

    doc_id = None
    if doc_key:
        context = runtime.context
        doc_id = DocumentationService(db=context.db).get_doc_id(
            connection_id=context.connection_id,
            project_key=context.project_key,
            doc_key=doc_key,
        )
        if not doc_id:
            return json.dumps(
                {"error": f"Documentation with key '{doc_key}' not found"}, indent=2
            )

    where_headers = None
    if where_headers:
        where_headers = {}
        for header in where_headers:
            level = header.get("level")
            text = header.get("text")
            if level and text:
                where_headers[level] = text
    vectorstore = DocumentationVectorStore()
    results = vectorstore.retrieve_similar(
        query=query,
        documentation_id=doc_id,
        where_headers=where_headers,
        k=k,
        min_similarity=min_similarity,
    )

    return json.dumps({"results": results}, indent=2)


doc_tools = [
    list_available_docs,
    search_in_docs,
]
