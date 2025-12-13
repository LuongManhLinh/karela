from typing import List, Optional, Any, Set

from pydantic import BaseModel, Field, ConfigDict

from common.agents.input_schemas import ContextInput

from .schemas import (
    WorkItemMinimal,
    UserStoryDto,
    WorkItem,
    WorkItemWithRef,
    DefectByLlm,
)


class DetectDefectSingleTypeInput(BaseModel):
    context: Optional[ContextInput] = None
    type: Optional[str] = None
    work_items: List[WorkItemMinimal] = Field(default_factory=list)

    model_config = ConfigDict(
        extra="ignore",
    )


class DetectDefectSingleItemInput(BaseModel):
    context: Optional[ContextInput] = None
    work_items: List[WorkItem] = Field(default_factory=list)

    model_config = ConfigDict(
        extra="ignore",
    )


class DetectDefectCrossTypesInput(BaseModel):
    context: Optional[ContextInput] = None
    work_items: List[WorkItemWithRef] = Field(default_factory=list)

    model_config = ConfigDict(
        extra="ignore",
    )


class GenerateGherkinInput(BaseModel):
    context: Optional[ContextInput] = None
    user_story: Optional[UserStoryDto] = None
    gherkin: Optional[Any] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class GenerateUserStoryInput(BaseModel):
    context: Optional[ContextInput] = None
    user_story: Optional[UserStoryDto] = None

    BEING_WRITTEN_TOKEN: str = "<...>"

    model_config = ConfigDict(
        extra="ignore",
    )


class NotifyDefectInput(BaseModel):
    defect_count: Optional[int] = None
    high_severity_count: Optional[int] = None
    related_defect_types: Optional[Set[str]] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class ReportDefectInput(BaseModel):
    defects: List[DefectByLlm] = Field(default_factory=list)
    analyzed_work_items: List[WorkItem] = Field(default_factory=list)

    model_config = ConfigDict(
        extra="ignore",
    )
