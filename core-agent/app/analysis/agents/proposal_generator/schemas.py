from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict, Field


class ProposalContent(BaseModel):
    """Schema for individual proposal content within a proposal."""

    type: Literal["CREATE", "UPDATE", "DELETE"] = Field(
        ...,
        description="The type of action for the proposal content.",
    )
    key: Optional[str] = Field(
        None,
        description="The story key for UPDATE or DELETE actions. Null for CREATE actions.",
    )
    summary: Optional[str] = Field(
        None,
        description="A brief summary of the User Story. Only valid for CREATE or UPDATE actions.",
    )
    description: Optional[str] = Field(
        None,
        description="A detailed description of the User Story. Only valid for CREATE or UPDATE actions. ",
    )
    explanation: Optional[str] = Field(
        None,
        description="An explanation of the rationale behind the proposed action.",
    )


class Proposal(BaseModel):
    """Schema for a proposal to improve User Stories and address defects."""

    defect_ids: List[str] = Field(
        ...,
        description="List of defect IDs that this proposal aims to address.",
    )
    contents: List[ProposalContent] = Field(
        ...,
        description="List of proposal contents detailing the actions to be taken.",
    )

    def validate_contents(self):
        for content in self.contents:
            if content.type not in ["CREATE", "UPDATE", "DELETE"]:
                raise ValueError(f"Invalid content type: {content.type}")
            if content.type in ["CREATE", "UPDATE"]:
                if not content.summary or not content.description:
                    raise ValueError(
                        f"Summary and description are required for content type: {content.type}"
                    )


class ProposalOutput(BaseModel):
    """Schema for the output of the proposal generator."""

    proposals: List[Proposal] = Field(
        ...,
        description="List of generated proposals to improve User Stories.",
    )
