from typing import Any, Dict, Optional


from pydantic import BaseModel, ConfigDict


class LlmContext(BaseModel):
    guidelines: Optional[str] = None
    additional_context: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class Documentation(BaseModel):
    product_vision: Optional[str] = None
    product_scope: Optional[str] = None
    sprint_goals: Optional[str] = None
    glossary: Optional[str] = None
    constraints: Optional[str] = None
    additional_docs: Optional[Dict[str, str]] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class ContextInput(BaseModel):
    documentation: Optional[Documentation] = None
    llm_context: Optional[LlmContext] = None

    model_config = ConfigDict(
        extra="ignore",
    )
