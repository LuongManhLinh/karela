from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Literal

from common.schemas import SessionSummary

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


class ChatSessionSummary(SessionSummary):
    model_config = ConfigDict(
        extra="ignore",
    )


class ChatSessionDto(ChatSessionSummary):
    messages: List[ChatMessageDto] = []


class MessageChunk(BaseModel):
    id: str
    role: MessageRole = "agent"
    content: str = ""
