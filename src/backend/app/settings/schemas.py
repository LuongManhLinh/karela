from pydantic import BaseModel, ConfigDict
from typing import Optional, Dict, Any, List
from datetime import datetime


class AdditionalFileDto(BaseModel):
    filename: str
    url: str


class SettingsDto(BaseModel):
    id: str
    connection_id: str
    project_key: str
    product_vision: Optional[str] = None
    product_scope: Optional[str] = None
    current_sprint_goals: Optional[str] = None
    glossary: Optional[str] = None
    additional_docs: Optional[Dict[str, Any]] = None
    additional_files: Optional[List[AdditionalFileDto]] = None
    updated_at: datetime


class CreateSettingsRequest(BaseModel):
    product_vision: Optional[str] = None
    product_scope: Optional[str] = None
    current_sprint_goals: Optional[str] = None
    glossary: Optional[str] = None
    additional_docs: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(extra="forbid")


class UpdateSettingsRequest(BaseModel):
    product_vision: Optional[str] = None
    product_scope: Optional[str] = None
    current_sprint_goals: Optional[str] = None
    glossary: Optional[str] = None
    additional_docs: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(extra="forbid")


class PreferenceDto(BaseModel):
    id: str
    connection_id: str
    project_key: str
    run_analysis_guidelines: Optional[str] = None
    gen_proposal_guidelines: Optional[str] = None
    gen_proposal_after_analysis: bool = False
    gen_proposal_mode: Optional[str] = None
    gen_language: Optional[str] = None
    chat_guidelines: Optional[str] = None
    updated_at: datetime


class CreatePreferenceRequest(BaseModel):
    run_analysis_guidelines: Optional[str] = None
    gen_proposal_guidelines: Optional[str] = None
    gen_proposal_after_analysis: bool = False
    gen_proposal_mode: Optional[str] = None
    gen_language: Optional[str] = None
    chat_guidelines: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class UpdatePreferenceRequest(BaseModel):
    run_analysis_guidelines: Optional[str] = None
    gen_proposal_guidelines: Optional[str] = None
    gen_proposal_after_analysis: Optional[bool] = None
    gen_proposal_mode: Optional[str] = None
    gen_language: Optional[str] = None
    chat_guidelines: Optional[str] = None

    model_config = ConfigDict(extra="forbid")
