from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime


# ── Text Documentation ──────────────────────────────────────────────


class TextDocumentationDto(BaseModel):
    id: str
    connection_id: str
    project_key: str
    name: str
    description: Optional[str] = None
    content: Optional[str] = None
    headers: Optional[List[dict]] = None
    created_at: datetime
    updated_at: datetime


class CreateTextDocumentationRequest(BaseModel):
    name: str
    content: str
    description: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class UpdateTextDocumentationRequest(BaseModel):
    description: Optional[str] = None
    content: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


# ── File Documentation ──────────────────────────────────────────────


class FileDocumentationDto(BaseModel):
    id: str
    connection_id: str
    project_key: str
    name: str
    url: str
    description: Optional[str] = None
    headers: Optional[List[dict]] = None
    created_at: datetime
    updated_at: datetime


class UpdateFileDocumentationRequest(BaseModel):
    description: Optional[str] = None

    model_config = ConfigDict(extra="forbid")
