from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


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


class UserStoryMinimal(BaseModel):
    key: Optional[str] = None
    summary: Optional[str] = None
    description: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class RelatedStory(UserStoryMinimal):
    """Represents a user story that is related to the target story, as identified by the Relational Graph Search."""

    reason: Optional[str] = Field(
        None,
        description="The reason why this story is considered related to the target story, as provided by the agent.",
    )

    model_config = ConfigDict(
        extra="ignore",
    )


class UserStoryTag(UserStoryMinimal):
    tags: Optional[list[str]] = None


class BucketGroup(BaseModel):
    target_story: UserStoryMinimal
    related_stories: List[UserStoryMinimal]
