from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any
from datetime import datetime


class SettingsDto(BaseModel):
    id: str
    connection_id: str
    project_key: str
    product_vision: Optional[str] = None
    product_scope: Optional[str] = None
    current_sprint_goals: Optional[str] = None
    glossary: Optional[str] = None
    additional_docs: Optional[Dict[str, Any]] = None
    llm_guidelines: Optional[str] = None
    last_updated: datetime


class CreateSettingsRequest(BaseModel):
    connection_id: str
    project_key: str
    product_vision: Optional[str] = None
    product_scope: Optional[str] = None
    current_sprint_goals: Optional[str] = None
    glossary: Optional[str] = None
    additional_docs: Optional[Dict[str, Any]] = None
    llm_guidelines: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class UpdateSettingsRequest(BaseModel):
    product_vision: Optional[str] = None
    product_scope: Optional[str] = None
    current_sprint_goals: Optional[str] = None
    glossary: Optional[str] = None
    additional_docs: Optional[Dict[str, Any]] = None
    llm_guidelines: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


