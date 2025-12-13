from typing import List, Literal, Optional
from pydantic import BaseModel, ConfigDict

from common.schemas import SessionSummary


class ProposalContentDto(BaseModel):
    id: str
    type: Literal["CREATE", "UPDATE", "DELETE", "UNKNOWN"]
    story_key: Optional[str]  # The key of the User Story (Jira Issue)
    summary: Optional[str]
    description: Optional[str]
    explanation: Optional[str]
    accepted: Optional[bool] = None  # None = pending, True = accepted, False = rejected

    model_config = ConfigDict(
        extra="ignore",
    )


class ProposalSummary(BaseModel):
    id: str
    key: str
    session_id: str
    project_key: str
    created_at: str

    model_config = ConfigDict(
        extra="ignore",
    )


class ProposalDto(ProposalSummary):
    source: Literal["CHAT", "ANALYSIS"]
    target_defect_keys: Optional[List[str]] = None
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
    target_defect_ids: Optional[List[str]] = None


class SessionsHavingProposals(BaseModel):
    analysis_sessions: List[SessionSummary]
    chat_sessions: List[SessionSummary]


class ProposalContentEditRequest(BaseModel):
    summary: Optional[str] = None
    description: Optional[str] = None
