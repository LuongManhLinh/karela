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
    project_key: str

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
    title: Optional[str] = None
    model_config = ConfigDict(
        extra="ignore",
    )


class ChatSessionDto(ChatSessionSummary):
    messages: list[ChatMessageDto] = []


class MessageChunk(BaseModel):
    id: str
    role: MessageRole = "agent"
    content: str = ""
