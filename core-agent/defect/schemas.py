from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, List, Dict, Literal


class AnalysisSummary(BaseModel):
    id: str
    status: Optional[str] = None
    type: Optional[str] = None
    started_at: Optional[str] = None
    ended_at: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class DefectDto(BaseModel):
    id: str
    type: Optional[str] = None
    severity: Optional[str] = None
    explanation: Optional[str] = None
    confidence: Optional[float] = None
    suggested_fix: Optional[str] = None
    solved: Optional[bool] = None
    work_item_keys: Optional[List[str]] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class AnalysisDetailDto(BaseModel):
    id: str
    defects: List[DefectDto]

    model_config = ConfigDict(
        extra="ignore",
    )


class AnalysisDto(AnalysisSummary):
    story_key: Optional[str] = None
    error_message: Optional[str] = None
    defects: Optional[List[DefectDto]] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class AnalysisRunRequest(BaseModel):
    project_key: str
    analysis_type: Optional[Literal["ALL", "TARGETED"]] = "ALL"
    target_story_key: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class DefectSolvedUpdateRequest(BaseModel):
    solved: bool


#######################################
# Chat Endpoints
########################################


class ChatSessionCreateRequest(BaseModel):
    project_key: str
    user_message: str
    story_key: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class ChatMessageDto(BaseModel):
    id: int
    role: Literal["user", "ai", "system", "tool", "analysis_progress"]
    content: str
    created_at: str

    model_config = ConfigDict(
        extra="ignore",
    )


class AnalysisProgressMessageDto(ChatMessageDto):
    analysis_id: str
    status: str


class ChatProposalContentDto(BaseModel):
    story_key: str  # The key of the User Story (Jira Issue)
    summary: Optional[str]
    description: Optional[str]

    model_config = ConfigDict(
        extra="ignore",
    )


class ChatProposalDto(BaseModel):
    id: str
    session_id: str
    project_key: str
    type: Literal["CREATE", "UPDATE", "UNKNOWN"]
    accepted: Optional[bool] = None  # None = pending, True = accepted, False = rejected
    created_at: str
    contents: List[ChatProposalContentDto]

    model_config = ConfigDict(
        extra="ignore",
    )


class ChatSessionDto(BaseModel):
    id: str
    project_key: str
    story_key: Optional[str] = None
    created_at: str
    messages: List[ChatMessageDto]
    change_proposals: List[ChatProposalDto]

    model_config = ConfigDict(
        extra="ignore",
    )


# Class to post new chat message
class ChatMessageCreateRequest(BaseModel):
    message: str
    project_key: str
    story_key: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class ChatMessagesResponse(BaseModel):
    messages: List[ChatMessageDto]

    model_config = ConfigDict(
        extra="ignore",
    )
