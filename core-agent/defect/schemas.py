from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, List, Dict
from common.schemas import CamelModel


class AnalysisSummary(CamelModel):
    id: str
    status: Optional[str] = None
    type: Optional[str] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class DefectDto(CamelModel):
    id: str
    type: Optional[str] = None
    severity: Optional[str] = None
    explanation: Optional[str] = None
    confidence: Optional[float] = None
    suggested_fix: Optional[str] = None
    solved: Optional[bool] = None
    work_item_keys: Optional[List[str]] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class AnalysisDetailDto(CamelModel):
    id: str
    defects: List[DefectDto]

    model_config = ConfigDict(
        extra="ignore",
    )


class AnalysisRunRequest(CamelModel):
    project_key: str = Field(..., description="The key of the project to analyze")
    analysis_type: str = Field(..., description="The type of analysis to perform")
    target_story_key: Optional[str] = Field(
        None, description="The key of the target user story for targeted analysis"
    )

    model_config = ConfigDict(
        extra="ignore",
    )


class DefectSolvedUpdateRequest(CamelModel):
    solved: bool
