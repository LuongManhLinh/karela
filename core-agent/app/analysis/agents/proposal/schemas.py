from typing import List, Literal, Optional
from pydantic import BaseModel, Field

from ..schemas import WorkItemMinimal, DefectInput
from ..input_schemas import ContextInput


class ProposalContent(BaseModel):
    """Schema for individual proposal content within a proposal, detailing the action to be taken on a User Story."""

    type: Literal["CREATE", "UPDATE", "DELETE"] = Field(
        description="The type of action for the proposal content.",
    )
    story_key: Optional[str] = Field(
        description="The story key for UPDATE or DELETE actions. Null for CREATE actions.",
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

    target_defect_ids: List[str] = Field(
        description="List of defect IDs that this proposal aims to address.",
    )
    contents: List[ProposalContent] = Field(
        description="List of proposal contents detailing the actions to be taken.",
    )


class ProposalInput(BaseModel):
    """Schema for the input to the proposal generator."""

    user_stories: List[WorkItemMinimal] = Field(
        description="List of User Stories relevant to the given defects",
    )
    defects: List[DefectInput] = Field(
        description="List of identified defects that need to be addressed.",
    )
    context_input: Optional[ContextInput] = Field(
        None,
        description="Optional contextual information to aid in proposal generation.",
    )


class ProposalOutput(BaseModel):
    """Schema for the output of the proposal generator."""

    proposals: List[Proposal] = Field(
        description="List of generated proposals to solve all the defects.",
    )
