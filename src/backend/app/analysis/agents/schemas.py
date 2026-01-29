from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class DefectByLlm(BaseModel):
    """The schema for detected defects among the User Stories."""

    type: str = Field(
        description="Type of the defect, one of the types mentioned in the instruction",
    )
    story_keys: List[str] = Field(
        description="Keys of the stories involved in the defect"
    )
    severity: str = Field(description="'LOW' | 'MEDIUM' | 'HIGH'")
    explanation: str = Field()
    confidence: float = Field()
    suggested_fix: str = Field()

    model_config = ConfigDict(
        extra="ignore",
    )


class DefectInput(DefectByLlm):
    """The schema for detected defects among the User Stories."""

    id: str = Field(
        ...,
        description="The key to identify the defect.",
    )

    model_config = ConfigDict(
        extra="ignore",
    )


class Lint(BaseModel):
    field: Optional[str] = None
    issue: Optional[str] = None
    suggested_replacement: Optional[str] = None
    message: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class UserStoryDto(BaseModel):
    title: Optional[str] = None
    role: Optional[str] = None
    feature: Optional[str] = None
    benefit: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class WorkItemMinimal(BaseModel):
    key: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class WorkItem(WorkItemMinimal):
    type: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class WorkItemWithRef(WorkItem):
    related_story_keys: List[str] = Field(default_factory=list)

    model_config = ConfigDict(
        extra="ignore",
    )
