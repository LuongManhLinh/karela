from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from common.schemas import StoryMinimal


class DefectByLlm(BaseModel):
    """The schema for detected defects among the User Stories."""

    type: str = Field(
        description="Type of the defect, one of the types mentioned in the instruction",
    )
    story_keys: list[str] = Field(
        description="Keys of the stories involved in the defect"
    )
    severity: str = Field(description="'LOW' | 'MEDIUM' | 'HIGH'")
    explanation: str = Field()
    confidence: float = Field()
    suggested_fix: str = Field()

    model_config = ConfigDict(
        extra="ignore",
    )


class RelatedStory(StoryMinimal):
    """Represents a user story that is related to the target story, as identified by the Relational Graph Search."""

    reason: Optional[str] = Field(
        None,
        description="The reason why this story is considered related to the target story, as provided by the agent.",
    )

    model_config = ConfigDict(
        extra="ignore",
    )


class StoryTag(StoryMinimal):
    tags: Optional[list[str]] = None


class BucketGroup(BaseModel):
    target_story: StoryMinimal
    related_stories: List[StoryMinimal]
