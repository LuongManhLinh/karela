from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime


class ACBase(BaseModel):
    content: str
    jira_story_id: str


class ACCreateRequest(ACBase):
    pass


class ACUpdate(BaseModel):
    content: Optional[str] = None
    jira_issue_key: Optional[str] = None


class ACResponse(ACBase):
    id: str
    jira_issue_key: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AIRequest(BaseModel):
    content: str
    cursor_line: int
    cursor_column: int
    context: Optional[str] = None


class AISuggestion(BaseModel):
    new_content: str
    explanation: str
    type: Literal["CREATE", "UPDATE", "DELETE"]
    position: dict


class AIResponse(BaseModel):
    suggestions: List[AISuggestion]
