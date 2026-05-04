"""Agent builders for the taxonomy service."""

from llm.dynamic_agent import GenimiDynamicAgent
from common.configs import LlmConfig

from ..schemas import (
    TaxonomySeedResponse,
    TaxonomyUpdateResponse,
    TaxonomyCategorizationResponse,
    TaxonomyValidationResponse,
    SeedValidationResponse,
)
from .prompts import (
    SEED_SYSTEM_PROMPT,
    EXTENSION_SYSTEM_PROMPT,
    CATEGORIZER_SYSTEM_PROMPT,
    VALIDATOR_SYSTEM_PROMPT,
    SEED_VALIDATOR_SYSTEM_PROMPT,
)


def _build_agent(system_prompt: str, response_schema: type) -> GenimiDynamicAgent:
    return GenimiDynamicAgent(
        model_name=LlmConfig.GEMINI_TAXONOMY_MODEL,
        temperature=LlmConfig.LLM_TAXONOMY_TEMPERATURE,
        top_p=LlmConfig.LLM_TAXONOMY_TOP_P,
        response_mime_type="application/json",
        response_schema=response_schema,
        api_keys=LlmConfig.GEMINI_API_KEYS,
        max_retries=LlmConfig.GEMINI_API_MAX_RETRY,
        system_prompt=system_prompt,
    )


def build_seed_agent() -> GenimiDynamicAgent:
    """Agent for generating initial taxonomy from the first batch (Pass 0)."""
    return _build_agent(
        system_prompt=SEED_SYSTEM_PROMPT,
        response_schema=TaxonomySeedResponse,
    )


def build_extension_agent() -> GenimiDynamicAgent:
    """Agent for extending taxonomy with subsequent batches or single stories (Pass 1)."""
    return _build_agent(
        system_prompt=EXTENSION_SYSTEM_PROMPT,
        response_schema=TaxonomyUpdateResponse,
    )


def build_categorizer_agent() -> GenimiDynamicAgent:
    """Agent for categorizing stories using the final taxonomy (Pass 2)."""
    return _build_agent(
        system_prompt=CATEGORIZER_SYSTEM_PROMPT,
        response_schema=TaxonomyCategorizationResponse,
    )


def build_validator_agent() -> GenimiDynamicAgent:
    """Agent for validating proposed taxonomy changes (VALID/INVALID/ADJUSTED)."""
    return _build_agent(
        system_prompt=VALIDATOR_SYSTEM_PROMPT,
        response_schema=TaxonomyValidationResponse,
    )


def build_seed_validator_agent() -> GenimiDynamicAgent:
    """Agent for validating the initial seed taxonomy."""
    return _build_agent(
        system_prompt=SEED_VALIDATOR_SYSTEM_PROMPT,
        response_schema=SeedValidationResponse,
    )
