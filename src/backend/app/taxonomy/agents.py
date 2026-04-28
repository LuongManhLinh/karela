"""Agent builders for the taxonomy service."""

from llm.dynamic_agent import GenimiDynamicAgent
from common.configs import LlmConfig

from .schemas import TaxonomyResponse
from .prompts import SEED_SYSTEM_PROMPT, EXTENSION_SYSTEM_PROMPT


def _build_taxonomy_agent(system_prompt: str) -> GenimiDynamicAgent:
    return GenimiDynamicAgent(
        model_name=LlmConfig.GEMINI_TAXONOMY_MODEL,
        temperature=LlmConfig.LLM_TAXONOMY_TEMPERATURE,
        response_mime_type="application/json",
        response_schema=TaxonomyResponse,
        api_keys=LlmConfig.GEMINI_API_KEYS,
        max_retries=LlmConfig.GEMINI_API_MAX_RETRY,
        system_prompt=system_prompt,
    )


def build_seed_agent() -> GenimiDynamicAgent:
    """Agent for generating initial taxonomy from the first batch."""
    return _build_taxonomy_agent(SEED_SYSTEM_PROMPT)


def build_extension_agent() -> GenimiDynamicAgent:
    """Agent for extending taxonomy with subsequent batches or single stories."""
    return _build_taxonomy_agent(EXTENSION_SYSTEM_PROMPT)


default_seed_agent = build_seed_agent()
default_extension_agent = build_extension_agent()
