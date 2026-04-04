from typing import List, Optional, Any, Set

from pydantic import BaseModel, Field, ConfigDict

from .schemas import (
    UserStoryMinimal,
    UserStoryDto,
    UserStory,
    UserStoryWithRef,
    DefectByLlm,
)


class DetectDefectSingleTypeInput(BaseModel):
    type: Optional[str] = None
    work_items: list[UserStoryMinimal] = Field(default_factory=list)

    model_config = ConfigDict(
        extra="ignore",
    )


class DetectDefectSingleItemInput(BaseModel):
    work_items: list[UserStory] = Field(default_factory=list)

    model_config = ConfigDict(
        extra="ignore",
    )


class DetectDefectCrossTypesInput(BaseModel):
    work_items: list[UserStoryWithRef] = Field(default_factory=list)

    model_config = ConfigDict(
        extra="ignore",
    )


class GenerateGherkinInput(BaseModel):
    user_story: Optional[UserStoryDto] = None
    gherkin: Optional[Any] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class GenerateUserStoryInput(BaseModel):
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
    defects: list[DefectByLlm] = Field(default_factory=list)
    analyzed_work_items: list[UserStory] = Field(default_factory=list)

    model_config = ConfigDict(
        extra="ignore",
    )
