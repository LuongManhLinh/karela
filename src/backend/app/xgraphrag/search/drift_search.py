from graphrag.query.context_builder.conversation_history import ConversationHistory
from graphrag.query.indexer_adapters import (
    read_indexer_entities,
    read_indexer_relationships,
    read_indexer_reports,
    read_indexer_text_units,
    read_indexer_report_embeddings,
)

from graphrag_vectors.lancedb import LanceDBVectorStore
from graphrag.query.structured_search.drift_search.drift_context import (
    DRIFTSearchContextBuilder,
)
from graphrag.query.structured_search.drift_search.search import DRIFTSearch
from graphrag.config.models.drift_search_config import DRIFTSearchConfig

from ..db.query import (
    get_communities,
    get_community_reports,
    get_entities,
    get_relationships,
    get_text_units,
)

from ..defines import COMMUNITY_LEVEL


async def drift_search(
    connection_id: str,
    project_key: str,
    query: str,
    chat_model,
    tokenizer,
    text_embedder,
    conversation_history: ConversationHistory | None = None,
    reduce: bool = True,
    prompt: str | None = None,
    reduce_prompt: str | None = None,
):
    search = DRIFTSearch(
        model=chat_model,
        context_builder=_get_drift_context_builder(
            connection_id,
            project_key,
            chat_model,
            text_embedder,
            tokenizer,
            prompt,
            reduce_prompt,
        ),
        tokenizer=tokenizer,
    )

    return await search.search(
        query=query,
        conversation_history=conversation_history,
        reduce=reduce,
    )


def _get_drift_context_builder(
    connection_id: str,
    project_key: str,
    chat_model,
    text_embedder,
    tokenizer,
    prompt=None,
    reduce_prompt=None,
):
    bucket_name = f"{connection_id}_{project_key}"
    lancedb_uri = f".workspace/{connection_id}/{project_key}/output/lancedb"

    entity_df = get_entities(bucket_name)
    community_df = get_communities(bucket_name)
    relationship_df = get_relationships(bucket_name)
    text_unit_df = get_text_units(bucket_name)
    report_df = get_community_reports(bucket_name)

    entities = read_indexer_entities(entity_df, community_df, COMMUNITY_LEVEL)

    # load description embeddings to an in-memory lancedb vectorstore
    # to connect to a remote db, specify url and port values.
    description_embedding_store = LanceDBVectorStore(
        db_uri=lancedb_uri,
        index_name="entity_description",
    )
    description_embedding_store.connect()

    full_content_embedding_store = LanceDBVectorStore(
        db_uri=lancedb_uri,
        index_name="community_full_content",
    )
    full_content_embedding_store.connect()

    relationships = read_indexer_relationships(relationship_df)

    text_units = read_indexer_text_units(text_unit_df)

    reports = read_indexer_reports(report_df, community_df, COMMUNITY_LEVEL)
    read_indexer_report_embeddings(reports, full_content_embedding_store)

    drift_params = DRIFTSearchConfig(
        primer_folds=1,
        drift_k_followups=3,
        n_depth=3,
        prompt=prompt,
        reduce_prompt=reduce_prompt,
    )

    return DRIFTSearchContextBuilder(
        model=chat_model,
        text_embedder=text_embedder,
        entities=entities,
        relationships=relationships,
        reports=reports,
        entity_text_embeddings=description_embedding_store,
        text_units=text_units,
        tokenizer=tokenizer,
        config=drift_params,
    )
