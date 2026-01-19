from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime


class ACCreateRequest(BaseModel):
    gen_with_ai: bool = False


class ACRegenerateRequest(BaseModel):
    content: str
    feedback: Optional[str] = None


class ACSummary(BaseModel):
    id: str
    key: Optional[str] = None
    story_key: str
    summary: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ACDto(ACSummary):
    description: str


class AIRequest(BaseModel):
    story_key: str
    content: str
    cursor_line: int
    cursor_column: int
    context: Optional[str] = None


class AISuggestionPosition(BaseModel):
    start_row: int
    start_column: int
    end_row: int
    end_column: int


class AISuggestion(BaseModel):
    new_content: str
    explanation: str
    type: Literal["CREATE", "UPDATE", "DELETE"]
    position: AISuggestionPosition


class AIResponse(BaseModel):
    suggestions: List[AISuggestion]
