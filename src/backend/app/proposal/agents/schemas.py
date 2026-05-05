from typing import Literal, Optional
from pydantic import BaseModel, Field

from app.analysis.agents.schemas import DefectByLlm
from common.schemas import StoryMinimal


class ProposalContent(BaseModel):
    """Schema for individual proposal content within a proposal, detailing the action to be taken on a User Story."""

    type: Literal["CREATE", "UPDATE", "DELETE"] = Field(
        description="The type of action for the proposal content.",
    )
    story_key: Optional[str] = Field(
        description="The story key for UPDATE or DELETE actions. Null for CREATE actions.",
    )
    original_story_key: Optional[str] = Field(
        description=(
            "The original story key that this proposal content derives from."
            "Used only for CREATE actions, if the proposal is generated from an existing story (e.g., splitting)."
        ),
    )
    summary: Optional[str] = Field(
        description="A brief summary of the User Story. Only valid for CREATE or UPDATE actions.",
    )
    description: Optional[str] = Field(
        description="A detailed description of the User Story. Only valid for CREATE or UPDATE actions. ",
    )
    explanation: Optional[str] = Field(
        description="An explanation of the rationale behind the proposed action.",
    )


class Proposal(BaseModel):
    """Schema for a proposal to improve User Stories and address defects."""

    target_defect_ids: list[str] = Field(
        description="List of defect IDs that this proposal aims to address.",
    )
    contents: list[ProposalContent] = Field(
        description="List of proposal contents detailing the actions to be taken.",
    )


class ProposalInput(BaseModel):
    """Schema for the input to the proposal generator."""

    user_stories: list[StoryMinimal] = Field(
        description="List of User Stories relevant to the given defects",
    )
    defects: list[DefectByLlm] = Field(
        description="List of identified defects that need to be addressed.",
    )


class ProposalOutput(BaseModel):
    """Schema for the output of the proposal generator."""

    proposals: list[Proposal] = Field(
        description="List of generated proposals to solve all the defects.",
    )


class ValidatorOutput(BaseModel):
    defects: list[DefectByLlm] = Field(description="List of detected defects, if any.")
