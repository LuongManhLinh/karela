"""Agent builders for the taxonomy service."""

from typing import Literal
from llm.dynamic_agent import DynamicAgent
from common.configs import LlmConfig

from .schemas import (
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


def _build_agent(
    system_prompt: str,
    response_schema: type,
    family: Literal["gemini", "openai"] = "openai",
):
    if family == "gemini":
        model_name = LlmConfig.GEMINI_TAXONOMY_MODEL
        api_keys = LlmConfig.GEMINI_API_KEYS
    elif family == "openai":
        model_name = LlmConfig.OPENAI_TAXONOMY_MODEL
        api_keys = LlmConfig.OPENAI_API_KEYS
    else:
        raise ValueError(f"Unsupported LLM family: {family}")

    print(
        f"Building {family} agent with model {model_name} and response schema {response_schema.__name__}"
    )

    return DynamicAgent(
        family=family,
        model_name=model_name,
        api_keys=api_keys,
        system_prompt=system_prompt,
        temperature=LlmConfig.LLM_TAXONOMY_TEMPERATURE,
        response_mime_type="application/json",
        response_schema=response_schema,
        top_p=LlmConfig.LLM_TAXONOMY_TOP_P,
    )


def build_seed_agent():
    """Agent for generating initial taxonomy from the first batch (Pass 0)."""
    return _build_agent(
        system_prompt=SEED_SYSTEM_PROMPT,
        response_schema=TaxonomySeedResponse,
    )


def build_extension_agent():
    """Agent for extending taxonomy with subsequent batches or single stories (Pass 1)."""
    return _build_agent(
        system_prompt=EXTENSION_SYSTEM_PROMPT,
        response_schema=TaxonomyUpdateResponse,
    )


def build_categorizer_agent():
    """Agent for categorizing stories using the final taxonomy (Pass 2)."""
    return _build_agent(
        system_prompt=CATEGORIZER_SYSTEM_PROMPT,
        response_schema=TaxonomyCategorizationResponse,
    )


def build_validator_agent():
    """Agent for validating proposed taxonomy changes (VALID/INVALID/ADJUSTED)."""
    return _build_agent(
        system_prompt=VALIDATOR_SYSTEM_PROMPT,
        response_schema=TaxonomyValidationResponse,
    )


def build_seed_validator_agent():
    """Agent for validating the initial seed taxonomy."""
    return _build_agent(
        system_prompt=SEED_VALIDATOR_SYSTEM_PROMPT,
        response_schema=SeedValidationResponse,
    )
