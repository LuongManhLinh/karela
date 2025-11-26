from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict


class ProposalContentDto(BaseModel):
    id: str
    type: Literal["CREATE", "UPDATE", "UNKNOWN"]
    key: Optional[str]  # The key of the User Story (Jira Issue)
    summary: Optional[str]
    description: Optional[str]
    explanation: Optional[str]
    accepted: Optional[bool] = None  # None = pending, True = accepted, False = rejected

    model_config = ConfigDict(
        extra="ignore",
    )


class ProposalDto(BaseModel):
    id: str
    source: Literal["CHAT", "ANALYSIS"]
    session_id: str
    project_key: str
    created_at: str
    contents: List[ProposalContentDto]

    model_config = ConfigDict(
        extra="ignore",
    )


class ProposeStoryRequest(BaseModel):
    type: Literal["CREATE", "UPDATE", "DELETE"]
    key: Optional[str] = (
        None  # The key of the User Story (Jira Issue). None for CREATE proposals
    )
    summary: Optional[str] = None
    description: Optional[str] = None
    explanation: Optional[str] = None


class CreateProposalRequest(BaseModel):
    connection_id: str
    source: Literal["CHAT", "ANALYSIS"]
    session_id: str
    project_key: str
    stories: List[ProposeStoryRequest]
