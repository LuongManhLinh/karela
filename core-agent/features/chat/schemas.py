from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, List, Dict, Literal, Union


MessageRole = Literal[
    "user",
    "agent",
    "system",
    "tool",
    "analysis_progress",
    "agent_function_call",
    "error",
]


class ChatSessionCreateRequest(BaseModel):
    connection_id: str
    project_key: str
    user_message: str
    story_key: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class ChatMessageDto(BaseModel):
    id: str
    role: MessageRole
    content: str
    created_at: str

    model_config = ConfigDict(
        extra="ignore",
    )


class ChatProposalContentDto(BaseModel):
    story_key: Optional[str]  # The key of the User Story (Jira Issue)
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


class ChatSessionSummary(BaseModel):
    id: str
    project_key: str
    story_key: Optional[str] = None
    created_at: str

    model_config = ConfigDict(
        extra="ignore",
    )


class ChatSessionDto(ChatSessionSummary):
    messages: List[ChatMessageDto]
    change_proposals: List[ChatProposalDto]


class MessageChunk(BaseModel):
    id: str
    role: MessageRole = "agent"
    content: str = ""
