from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class TextDocumentationDto(BaseModel):
    id: str
    connection_id: str
    project_key: str
    name: str
    description: Optional[str] = None
    content: Optional[str] = None
    headers: Optional[list[dict]] = None
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


class FileDocumentationDto(BaseModel):
    id: str
    connection_id: str
    project_key: str
    name: str
    url: str
    description: Optional[str] = None
    headers: Optional[list[dict]] = None
    created_at: datetime
    updated_at: datetime


class UpdateFileDocumentationRequest(BaseModel):
    description: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class DocumentationSummary(BaseModel):
    key: str
    name: str
    description: Optional[str] = None
    headers: Optional[list[dict]] = None
