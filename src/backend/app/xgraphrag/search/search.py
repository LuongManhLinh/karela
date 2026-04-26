from typing import Literal
import os

from graphrag.query.context_builder.conversation_history import ConversationHistory


from .global_search import global_search
from .drift_search import drift_search
from .local_search import local_search
from ..defines import chat_model, tokenizer, text_embedder


def search(
    connection_id: str,
    project_key: str,
    query: str,
    method: Literal["local", "global", "drift"],
    conversation_turns: list[dict[str, str]] | None = None,
    local_search_system_prompt: str | None = None,
    global_search_map_system_prompt: str | None = None,
    global_search_reduce_system_prompt: str | None = None,
    drift_search_prompt: str | None = None,
    drift_search_reduce_prompt: str | None = None,
    auto_prompt: bool = True,
):
    """Performs a search in the Graphrag system using the specified method (local, global, or drift)."""
    if not os.path.exists(f".workspace/{connection_id}/{project_key}"):
        raise ValueError(
            f"GraphRAG Search is currently not available for connection_id={connection_id} and project_key={project_key}."
        )

    history = None
    if conversation_turns:
        history = ConversationHistory.from_list(conversation_turns)
    if method == "local":
        return local_search(
            connection_id=connection_id,
            project_key=project_key,
            query=query,
            chat_model=chat_model,
            tokenizer=tokenizer,
            text_embedder=text_embedder,
            conversation_history=history,
            system_prompt=local_search_system_prompt,
            auto_prompt=auto_prompt,
        )
    elif method == "global":
        return global_search(
            connection_id=connection_id,
            project_key=project_key,
            query=query,
            chat_model=chat_model,
            tokenizer=tokenizer,
            conversation_history=history,
            map_system_prompt=global_search_map_system_prompt,
            reduce_system_prompt=global_search_reduce_system_prompt,
            auto_prompt=auto_prompt,
        )
    elif method == "drift":
        return drift_search(
            connection_id=connection_id,
            project_key=project_key,
            query=query,
            chat_model=chat_model,
            tokenizer=tokenizer,
            text_embedder=text_embedder,
            conversation_history=history,
            prompt=drift_search_prompt,
            reduce_prompt=drift_search_reduce_prompt,
            auto_prompt=auto_prompt,
        )
    else:
        raise ValueError(f"Unsupported search method: {method}")
