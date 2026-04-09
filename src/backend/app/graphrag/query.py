import json
from typing import Literal
from pydantic import BaseModel

from graphrag_llm.completion.completion_factory import (
    create_completion,
    create_tokenizer,
)
from graphrag_llm.embedding.embedding_factory import create_embedding
from graphrag_llm.config import ModelConfig, TokenizerConfig
import os

import pandas as pd
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
from graphrag.query.structured_search.local_search.search import LocalSearch
from graphrag_vectors import IndexSchema
from graphrag_vectors.lancedb import LanceDBVectorStore

from common.configs import GraphRAGConfig


chat_config = ModelConfig(
    api_key=GraphRAGConfig.MODEL_API_KEY,
    model_provider=GraphRAGConfig.MODEL_PROVIDER,
    # model="gemma-4-31b-it",
    model=GraphRAGConfig.CHAT_MODEL,
)

tokenizer_config = TokenizerConfig(model_id=GraphRAGConfig.TOKENIZER_MODEL_ID)

tokenizer = create_tokenizer(tokenizer_config)

chat_model = create_completion(model_config=chat_config)

embedder_config = ModelConfig(
    api_key=GraphRAGConfig.MODEL_API_KEY,
    model_provider=GraphRAGConfig.MODEL_PROVIDER,
    model=GraphRAGConfig.EMBEDDING_MODEL,
)

text_embedder = create_embedding(model_config=embedder_config)

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


def search(
    connection_id: str,
    project_key: str,
    query: str,
    method: Literal["local", "global", "drift"],
    response_schema: BaseModel | None = None,
):
    pass


def _prepare_data(
    connection_id: str,
    project_key: str,
):
    INPUT_DIR = f".workspace/{connection_id}/{project_key}/output"
    LANCEDB_URI = f"{INPUT_DIR}/lancedb"

    COMMUNITY_REPORT_TABLE = "community_reports"
    ENTITY_TABLE = "entities"
    COMMUNITY_TABLE = "communities"
    RELATIONSHIP_TABLE = "relationships"
    TEXT_UNIT_TABLE = "text_units"
    COMMUNITY_LEVEL = 2

    entity_df = pd.read_parquet(f"{INPUT_DIR}/{ENTITY_TABLE}.parquet")
    community_df = pd.read_parquet(f"{INPUT_DIR}/{COMMUNITY_TABLE}.parquet")

    entities = read_indexer_entities(entity_df, community_df, COMMUNITY_LEVEL)

    description_embedding_store = LanceDBVectorStore(
        db_uri=LANCEDB_URI, index_name="entity_description"
    )
    description_embedding_store.connect()

    relationship_df = pd.read_parquet(f"{INPUT_DIR}/{RELATIONSHIP_TABLE}.parquet")
    relationships = read_indexer_relationships(relationship_df)

    report_df = pd.read_parquet(f"{INPUT_DIR}/{COMMUNITY_REPORT_TABLE}.parquet")
    reports = read_indexer_reports(report_df, community_df, COMMUNITY_LEVEL)

    text_unit_df = pd.read_parquet(f"{INPUT_DIR}/{TEXT_UNIT_TABLE}.parquet")
    text_units = read_indexer_text_units(text_unit_df)

    context_builder = LocalSearchMixedContext(
        community_reports=reports,
        text_units=text_units,
        entities=entities,
        relationships=relationships,
        entity_text_embeddings=description_embedding_store,
        embedding_vectorstore_key=EntityVectorStoreKey.ID,
        text_embedder=text_embedder,
        tokenizer=tokenizer,
    )

    search_engine = LocalSearch(
        model=chat_model,
        context_builder=context_builder,
        tokenizer=tokenizer,
        model_params=model_params,
        context_builder_params=local_context_params,
        response_type="multiple paragraphs",  # free form text describing the response type and format, can be anything, e.g. prioritized list, single paragraph, multiple paragraphs, multiple-page report
    )
