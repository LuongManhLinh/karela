from pathlib import Path
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


GLOBAL_SEARCH_MAP_SYSTEM_PROMPT_FILE = "global_search_map_system_prompt.txt"
GLOBAL_SEARCH_REDUCE_SYSTEM_PROMPT_FILE = "global_search_reduce_system_prompt.txt"


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
    auto_prompt: bool = True,
):
    if auto_prompt and not map_system_prompt:
        map_system_prompt = _read_project_prompt(
            connection_id=connection_id,
            project_key=project_key,
            prompt_file=GLOBAL_SEARCH_MAP_SYSTEM_PROMPT_FILE,
        )

    if auto_prompt and not reduce_system_prompt:
        reduce_system_prompt = _read_project_prompt(
            connection_id=connection_id,
            project_key=project_key,
            prompt_file=GLOBAL_SEARCH_REDUCE_SYSTEM_PROMPT_FILE,
        )

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
        json_mode=False,  # set this to False if your LLM model does not support JSON mode.
        context_builder_params=context_builder_params,
        concurrent_coroutines=32,
        response_type="multiple paragraphs",  # free form text describing the response type and format, can be anything, e.g. prioritized list, single paragraph, multiple paragraphs, multiple-page report
    )

    return await search_engine.search(query, conversation_history)


def _read_project_prompt(connection_id: str, project_key: str, prompt_file: str) -> str:
    prompt_path = Path(
        f".workspace/{connection_id}/{project_key}/prompts/{prompt_file}"
    )
    return prompt_path.read_text(encoding="utf-8")


def _get_community_context(
    connection_id: str, project_key: str, tokenizer, use_community_weights: bool = False
) -> GlobalCommunityContext:

    community_df = get_communities(connection_id, project_key)
    entity_df = get_entities(connection_id, project_key)
    report_df = get_community_reports(connection_id, project_key)

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
