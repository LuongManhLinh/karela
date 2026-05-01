from langchain.tools import tool, ToolRuntime
from common.agents.schemas import LlmContext
import json

from .vectorstore import DocumentationVectorStore
from .services import DocumentationService
from common.database import get_db


@tool
def list_available_docs(runtime: ToolRuntime[LlmContext]) -> str:
    """Lists all available documentation. This function should be called before calling search_in_docs to get the list of available documentation keys.
    Returns:
        str: A JSON string containing the list of available documentation
    """
    print("| Tool: list_available_docs called")
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
    k: int = 5,
) -> str:
    """Searches for relevant information in the documentation. This function should be called after calling list_available_docs to get the list of available documentation keys and optionally specify a doc_key to search in a specific documentation.
    Args:
        query (str): The search query
        doc_key (str, optional): The key of the documentation to search in.
            If not provided, searches in all documentation. Defaults to None.
        k (int, optional): The number of top results to return. Defaults to 5.
    Returns:
        str: A JSON string containing the search results
    """
    print(
        f"| Tool: search_in_docs called with query='{query}', doc_key='{doc_key}', k={k}"
    )

    context = runtime.context
    service = DocumentationService(db=context.db)

    doc_id = None
    if doc_key:
        doc_id = service.get_doc_id(
            connection_id=context.connection_id,
            project_key=context.project_key,
            doc_key=doc_key,
        )
        if not doc_id:
            return json.dumps(
                {"error": f"Documentation with key '{doc_key}' not found"}, indent=2
            )

    vectorstore = DocumentationVectorStore()
    results = vectorstore.retrieve_similar(
        query=query,
        documentation_id=doc_id,
        k=k,
    )

    return json.dumps({"results": results}, indent=2)


doc_tools = [
    list_available_docs,
    search_in_docs,
]
