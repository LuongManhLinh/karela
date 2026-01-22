from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


class ACCreateRequest(BaseModel):
    gen_with_ai: bool = False


class ACUpdateRequest(BaseModel):
    content: str


class ACRegenerateRequest(ACUpdateRequest):
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
    ac_id: str
    content: str
    cursor_line: int
    cursor_column: int
    context: Optional[str] = None


class AISuggestion(BaseModel):
    """AI Suggestion Schema"""

    suggestions: str = Field(description="The suggested content")
    explanation: str = Field(description="Explanation for the suggestion")


class AIResponse(BaseModel):
    suggestions: List[AISuggestion]
