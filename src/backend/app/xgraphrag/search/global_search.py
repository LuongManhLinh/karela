import pandas as pd
from graphrag.query.indexer_adapters import (
    read_indexer_communities,
    read_indexer_entities,
    read_indexer_reports,
)
from graphrag.query.structured_search.global_search.community_context import (
    GlobalCommunityContext,
)
from graphrag.query.structured_search.global_search.search import GlobalSearch
from graphrag.query.context_builder.conversation_history import ConversationHistory

from ..db.query import get_communities, get_community_reports, get_entities
from ..defines import COMMUNITY_LEVEL


COMMUNITY_LEVEL = 2

context_builder_params = {
    "use_community_summary": False,  # False means using full community reports. True means using community short summaries.
    "shuffle_data": True,
    "include_community_rank": True,
    "min_community_rank": 0,
    "community_rank_name": "rank",
    "include_community_weight": True,
    "community_weight_name": "occurrence weight",
    "normalize_community_weight": True,
    "max_tokens": 12_000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 5000)
    "context_name": "Reports",
}

map_llm_params = {
    "max_tokens": 1000,
    "temperature": 0.0,
    "response_format": {"type": "json_object"},
}

reduce_llm_params = {
    "max_tokens": 2000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 1000-1500)
    "temperature": 0.0,
}


async def global_search(
    connection_id: str,
    project_key: str,
    query: str,
    chat_model,
    tokenizer,
    map_system_prompt: str | None = None,
    reduce_system_prompt: str | None = None,
    conversation_history: ConversationHistory | None = None,
    use_community_weights: bool = False,
):
    search_engine = GlobalSearch(
        model=chat_model,
        map_system_prompt=map_system_prompt,
        reduce_system_prompt=reduce_system_prompt,
        context_builder=_get_community_context(
            connection_id=connection_id,
            project_key=project_key,
            tokenizer=tokenizer,
            use_community_weights=use_community_weights,
        ),
        tokenizer=tokenizer,
        max_data_tokens=12_000,  # change this based on the token limit you have on your model (if you are using a model with 8k limit, a good setting could be 5000)
        map_llm_params=map_llm_params,
        reduce_llm_params=reduce_llm_params,
        allow_general_knowledge=False,  # set this to True will add instruction to encourage the LLM to incorporate general knowledge in the response, which may increase hallucinations, but could be useful in some use cases.
        json_mode=True,  # set this to False if your LLM model does not support JSON mode.
        context_builder_params=context_builder_params,
        concurrent_coroutines=32,
        response_type="multiple paragraphs",  # free form text describing the response type and format, can be anything, e.g. prioritized list, single paragraph, multiple paragraphs, multiple-page report
    )

    return await search_engine.search(
        query=query,
        conversation_history=conversation_history,
    )


def _get_community_context(
    connection_id: str, project_key: str, tokenizer, use_community_weights: bool = False
) -> GlobalCommunityContext:
    bucket_name = f"{connection_id}_{project_key}"
    parquet_dir = f".workspace/{connection_id}/{project_key}/output"

    community_df = get_communities(bucket_name)
    entity_df = get_entities(bucket_name)
    report_df = get_community_reports(parquet_dir)

    communities = read_indexer_communities(community_df, report_df)
    reports = read_indexer_reports(report_df, community_df, COMMUNITY_LEVEL)
    entities = None
    if use_community_weights:
        entities = read_indexer_entities(entity_df, community_df, COMMUNITY_LEVEL)

    return GlobalCommunityContext(
        community_reports=reports,
        communities=communities,
        entities=entities,  # default to None if you don't want to use community weights for ranking
        tokenizer=tokenizer,
    )
