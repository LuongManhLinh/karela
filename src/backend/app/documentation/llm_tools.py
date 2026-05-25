from langchain.tools import tool, ToolRuntime
from common.agents.schemas import LlmContext
import json

from .vectorstore import DocumentationVectorStore
from .services import DocumentationService
from common.database import SessionLocal


@tool
def list_available_docs(runtime: ToolRuntime[LlmContext]) -> str:
    """Lists all available documentation. This function should be called before calling search_in_docs to get the list of available documentation keys.
    Returns:
        str: A JSON string containing the list of available documentation
    """
    print("| Tool: list_available_docs called")
    context = runtime.context

    db = SessionLocal()
    try:
        docs = DocumentationService(db=db).list_all_docs_for_project(
            connection_id=context.connection_id, project_key=context.project_key
        )
    finally:
        db.close()

    print(f"| Tool: list_available_docs listed {len(docs)} docs")
    return json.dumps({"docs": docs}, indent=2)


@tool
def search_in_docs(
    runtime: ToolRuntime[LlmContext],
    query: str,
    doc_key: str | None = None,
    k: int = 5,
) -> str:
    """Searches for relevant information in the documentation. This function should be called after calling list_available_docs to get the list of available documentation keys and optionally specify a doc_key to search in a specific documentation.

    NOTE: This function should be called sequentially. DO NOT call this function many times at the same time as it may cause issues with the vector store. You should wait for the response of this function before calling it again.

    Args:
        query (str): The search query
        doc_key (str, optional): The key of the documentation to search in.
            If not provided, searches in all documentation. Defaults to null.
        k (int, optional): The number of top results to return. Defaults to 5.
    Returns:
        str: A JSON string containing the search results
    """
    print(
        f"| Tool: search_in_docs called with query='{query}', doc_key={doc_key}, k={k}"
    )

    context = runtime.context

    db = SessionLocal()
    try:
        service = DocumentationService(db=db)
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
    finally:
        db.close()

    vectorstore = DocumentationVectorStore()
    results = vectorstore.retrieve_similar(
        query=query,
        documentation_id=doc_id,
        k=k,
    )

    print(f"| Tool: search_in_docs retrieved {len(results)} results")

    return json.dumps({"results": results}, indent=2)


@tool
def get_doc_details(runtime: ToolRuntime[LlmContext], doc_key: str) -> str:
    """Gets the details of a specific documentation by its key. This function can be used to get more information about a specific documentation before searching in it.
    Args:
        doc_key (str): The key of the documentation to get details for.
    Returns:
        str: A JSON string containing the details of the documentation
    """
    print(f"| Tool: get_doc_details called with doc_key='{doc_key}'")

    context = runtime.context

    db = SessionLocal()
    try:
        service = DocumentationService(db=db)
        details = service.get_doc_details(
            connection_id=context.connection_id,
            project_key=context.project_key,
            doc_key=doc_key,
        )

    finally:
        db.close()

    if not details:
        return json.dumps(
            {"error": f"Documentation with key '{doc_key}' not found"}, indent=2
        )

    print(f"| Tool: get_doc_details retrieved details for doc_key='{doc_key}'")

    return json.dumps(details, indent=2)


doc_tools = [list_available_docs, search_in_docs, get_doc_details]
