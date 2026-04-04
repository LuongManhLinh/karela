from pydantic import BaseModel, ConfigDict
from typing import Literal, Optional
from datetime import datetime


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
    gen_ac_guidelines: Optional[str] = None
    updated_at: datetime


class CreatePreferenceRequest(BaseModel):
    run_analysis_guidelines: Optional[str] = None
    gen_proposal_guidelines: Optional[str] = None
    gen_proposal_after_analysis: bool = False
    gen_proposal_mode: Optional[str] = None
    gen_language: Optional[str] = None
    chat_guidelines: Optional[str] = None
    gen_ac_guidelines: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class UpdatePreferenceRequest(BaseModel):
    run_analysis_guidelines: Optional[str] = None
    gen_proposal_guidelines: Optional[str] = None
    gen_proposal_after_analysis: Optional[bool] = None
    gen_proposal_mode: Optional[str] = None
    gen_language: Optional[str] = None
    chat_guidelines: Optional[str] = None
    gen_ac_guidelines: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class ProposalPreferenceDto(BaseModel):
    gen_proposal_guidelines: Optional[str] = None
    gen_proposal_mode: Optional[Literal["COMPLEX", "SIMPLE"]] = None
    gen_language: Optional[str] = None


class AnalysisPreferenceDto(BaseModel):
    run_analysis_guidelines: Optional[str] = None
    gen_proposal_after_analysis: bool = False
    gen_language: Optional[str] = None


class ChatPreferenceDto(BaseModel):
    chat_guidelines: Optional[str] = None


class ACPreferenceDto(BaseModel):
    gen_ac_guidelines: Optional[str] = None
