from sqlalchemy.orm import Session
from pydantic import BaseModel


class LlmContext(BaseModel):
    connection_id: str
    project_key: str
    db: Session

    model_config = {
        "arbitrary_types_allowed": True,
        "extra": "forbid",
    }
