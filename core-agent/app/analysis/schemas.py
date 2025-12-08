from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, List, Dict, Literal

from common.schemas import SessionSummary


class AnalysisSummary(SessionSummary):
    status: Optional[str] = None
    type: Optional[str] = None
    ended_at: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class DefectDto(BaseModel):
    id: str
    key: str
    type: Optional[str] = None
    severity: Optional[str] = None
    explanation: Optional[str] = None
    confidence: Optional[float] = None
    suggested_fix: Optional[str] = None
    solved: Optional[bool] = None
    story_keys: Optional[List[str]] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class AnalysisDto(AnalysisSummary):
    defects: List[DefectDto]

    model_config = ConfigDict(
        extra="ignore",
    )


class RunAnalysisRequest(BaseModel):
    analysis_type: Optional[Literal["ALL", "TARGETED"]] = "ALL"
    target_story_key: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class RunAnalysisResponse(BaseModel):
    id: str
    key: str

    model_config = ConfigDict(
        extra="ignore",
    )


class AnalysisStatusDto(BaseModel):
    id: str
    status: str

    model_config = ConfigDict(
        extra="ignore",
    )


class AnalysisStatusesRequest(BaseModel):
    analysis_ids: List[str]

    model_config = ConfigDict(
        extra="ignore",
    )
