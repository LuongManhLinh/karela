import pandas as pd
from typing import Dict, Any, Tuple
from graphrag.index.workflows.create_community_reports import create_community_reports
from graphrag.index.workflows.extract_graph import extract_graph


# Example callbacks
class MockCallbacks:
    def on_error(self, *args, **kwargs):
        pass

    def on_warning(self, *args, **kwargs):
        pass

    def on_progress(self, *args, **kwargs):
        pass


async def run_extract_graph_workflow(
    text_units_df: pd.DataFrame,
    extraction_model,
    summarization_model,
    settings: Dict[str, Any],
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Executes the GraphRAG `extract_graph` workflow on the text units generated.
    Returns Entities and Relationships DataFrames.
    """
    extract_config = settings.get("extract_graph", {})
    prompt_path = extract_config.get("prompt", "prompts/extract_graph.txt")
    with open(prompt_path, "r", encoding="utf-8") as f:
        extraction_prompt = f.read()

    sum_config = settings.get("summarize_descriptions", {})
    sum_prompt_path = sum_config.get("prompt", "prompts/summarize_descriptions.txt")
    with open(sum_prompt_path, "r", encoding="utf-8") as f:
        sum_prompt = f.read()

    entity_types = extract_config.get(
        "entity_types", ["KEY", "ROLE", "ACTION", "VALUE", "RESOURCE", "SYSTEM"]
    )
    max_gleanings = extract_config.get("max_gleanings", 1)

    callbacks = MockCallbacks()

    # extract_graph returns (entities, relationships)
    entities_df, relationships_df, _, _ = await extract_graph(
        text_units=text_units_df,
        callbacks=callbacks,
        extraction_model=extraction_model,
        extraction_prompt=extraction_prompt,
        entity_types=entity_types,
        max_gleanings=max_gleanings,
        extraction_num_threads=1,
        extraction_async_type="asyncio",
        summarization_model=summarization_model,
        max_summary_length=sum_config.get("max_length", 500),
        max_input_tokens=12000,
        summarization_prompt=sum_prompt,
        summarization_num_threads=1,
    )
    return entities_df, relationships_df


async def run_create_community_reports_workflow(
    relationships_df: pd.DataFrame,
    entities_df: pd.DataFrame,
    communities_df: pd.DataFrame,
    model,
    tokenizer,
    settings: Dict[str, Any],
) -> pd.DataFrame:
    """
    Create community reports using the built-in Microsoft GraphRAG workflow.
    """
    report_config = settings.get("community_reports", {})
    prompt_path = report_config.get(
        "graph_prompt", "prompts/community_report_graph.txt"
    )
    with open(prompt_path, "r", encoding="utf-8") as f:
        prompt = f.read()

    callbacks = MockCallbacks()

    community_reports_df = await create_community_reports(
        relationships=relationships_df,
        entities=entities_df,
        communities=communities_df,
        claims_input=None,
        callbacks=callbacks,
        model=model,
        tokenizer=tokenizer,
        prompt=prompt,
        max_input_length=report_config.get("max_input_length", 8000),
        max_report_length=report_config.get("max_length", 2000),
        num_threads=1,
        async_type="asyncio",
    )
    return community_reports_df
