from typing import Literal, Optional
from pydantic import BaseModel, Field


class ProposalContent(BaseModel):
    """Schema for individual proposal content within a proposal, detailing the action to be taken on a User Story."""

    type: Literal["CREATE", "UPDATE", "DELETE"] = Field(
        description="The type of action for the proposal content.",
    )
    story_key: Optional[str] = Field(
        default=None,
        description="The story key for UPDATE or DELETE actions. Null for CREATE actions.",
    )
    original_story_key: Optional[str] = Field(
        default=None,
        description=(
            "The original story key that this proposal content derives from."
            "Used only for CREATE actions, if the proposal is generated from an existing story (e.g., splitting)."
        ),
    )
    summary: Optional[str] = Field(
        default=None,
        description="A brief summary of the User Story. Only valid for CREATE or UPDATE actions.",
    )
    description: Optional[str] = Field(
        default=None,
        description="A detailed description of the User Story. Only valid for CREATE or UPDATE actions. ",
    )
    explanation: Optional[str] = Field(
        default=None,
        description="An explanation of the rationale behind the proposed action.",
    )


content = ProposalContent(
    type="DELETE",
    story_key="IB2-123",
)
print(content.model_dump_json(indent=2))
