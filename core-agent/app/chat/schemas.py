from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any, List, Dict, Literal, Union

from app.proposal.schemas import ProposalDto


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


class ChatSessionSummary(BaseModel):
    id: str
    project_key: str
    story_key: Optional[str] = None
    created_at: str

    model_config = ConfigDict(
        extra="ignore",
    )


class MessageChunk(BaseModel):
    id: str
    role: MessageRole = "agent"
    content: str = ""
