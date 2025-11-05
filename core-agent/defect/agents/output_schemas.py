from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict

from .general_schemas import UserStoryDto, Lint, DefectByLlm


class DetectDefectOutput(BaseModel):
    defects: List[DefectByLlm] = Field()


class ReportDefectOutput(BaseModel):
    """A report of the defects"""

    title: str = Field(
        description="A concise title, the most important information of the summary, around 5 words",
    )

    content: str = Field(description="The detailed summary")

    model_config = ConfigDict(
        extra="ignore",
    )


class GenerateGherkinOutput(BaseModel):
    gherkin: Optional[Any] = None
    confidence: Optional[float] = None
    explanation: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class GenerateUserStoryOutput(BaseModel):
    userStory: Optional[UserStoryDto] = None
    lints: List[Lint] = Field(default_factory=list)
    confidence: Optional[float] = None
    explanation: Optional[str] = None

    START_SUGGESTION_TOKEN: str = "<|s|>"
    END_SUGGESTION_TOKEN: str = "<|e|>"

    model_config = ConfigDict(
        extra="ignore",
    )


class ImproveItemOutput(BaseModel):
    lints: List[Lint] = Field(default_factory=list)
    confidence: Optional[float] = None
    explanation: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )
