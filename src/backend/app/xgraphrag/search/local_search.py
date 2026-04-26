from graphrag.query.structured_search.local_search.search import LocalSearch
from graphrag.query.context_builder.entity_extraction import EntityVectorStoreKey
from graphrag.query.context_builder.conversation_history import ConversationHistory
import pandas as pd
from pathlib import Path
from graphrag.query.context_builder.entity_extraction import EntityVectorStoreKey
from graphrag.query.indexer_adapters import (
    read_indexer_entities,
    read_indexer_relationships,
    read_indexer_reports,
    read_indexer_text_units,
)
from graphrag.query.structured_search.local_search.mixed_context import (
    LocalSearchMixedContext,
)

from graphrag_vectors.lancedb import LanceDBVectorStore

from ..db.query import (
    get_communities,
    get_community_reports,
    get_entities,
    get_relationships,
    get_text_units,
)

from ..defines import COMMUNITY_LEVEL


LOCAL_SEARCH_SYSTEM_PROMPT_FILE = "local_search_system_prompt.txt"

local_context_params = {
    "text_unit_prop": 0.5,
    "community_prop": 0.1,
    "conversation_history_max_turns": 5,
    "conversation_history_user_turns_only": True,
    "top_k_mapped_entities": 10,
    "top_k_relationships": 10,
    "include_entity_rank": True,
    "include_relationship_weight": True,
    "include_community_rank": False,
    "return_candidate_context": False,
    "embedding_vectorstore_key": EntityVectorStoreKey.ID,  # set this to EntityVectorStoreKey.TITLE if the vectorstore uses entity title as ids
    "max_tokens": 12_000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 5000)
}

model_params = {
    "max_tokens": 2_000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 1000=1500)
    "temperature": 0.0,
}


async def local_search(
    connection_id: str,
    project_key: str,
    query: str,
    chat_model,
    tokenizer,
    text_embedder,
    system_prompt: str | None = None,
    conversation_history: ConversationHistory | None = None,
    auto_prompt: bool = True,
):
    if auto_prompt and not system_prompt:
        system_prompt = _read_project_prompt(
            connection_id=connection_id,
            project_key=project_key,
            prompt_file=LOCAL_SEARCH_SYSTEM_PROMPT_FILE,
        )

    search_engine = LocalSearch(
        model=chat_model,
        system_prompt=system_prompt,
        context_builder=_get_context_builder(
            connection_id=connection_id,
            project_key=project_key,
            text_embedder=text_embedder,
            tokenizer=tokenizer,
        ),
        tokenizer=tokenizer,
        model_params=model_params,
        context_builder_params=local_context_params,
        response_type="multiple paragraphs",
    )

    return await search_engine.search(query, conversation_history)


def _read_project_prompt(connection_id: str, project_key: str, prompt_file: str) -> str:
    prompt_path = Path(
        f".workspace/{connection_id}/{project_key}/prompts/{prompt_file}"
    )
    return prompt_path.read_text(encoding="utf-8")


def _get_context_builder(
    connection_id: str, project_key: str, text_embedder, tokenizer
):
    lancedb_uri = f".workspace/{connection_id}/{project_key}/output/lancedb"

    entity_df = get_entities(connection_id, project_key)
    community_df = get_communities(connection_id, project_key)
    relationship_df = get_relationships(connection_id, project_key)
    report_df = get_community_reports(connection_id, project_key)
    text_unit_df = get_text_units(connection_id, project_key)

    entities = read_indexer_entities(entity_df, community_df, COMMUNITY_LEVEL)
    description_embedding_store = LanceDBVectorStore(
        db_uri=lancedb_uri, index_name="entity_description"
    )
    description_embedding_store.connect()
    relationships = read_indexer_relationships(relationship_df)
    reports = read_indexer_reports(report_df, community_df, COMMUNITY_LEVEL)

    text_units = read_indexer_text_units(text_unit_df)

    return LocalSearchMixedContext(
        community_reports=reports,
        text_units=text_units,
        entities=entities,
        relationships=relationships,
        entity_text_embeddings=description_embedding_store,
        embedding_vectorstore_key=EntityVectorStoreKey.ID,
        text_embedder=text_embedder,
        tokenizer=tokenizer,
    )
