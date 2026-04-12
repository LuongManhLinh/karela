from typing import Literal
from pydantic import BaseModel, model_validator

type IncrementalAction = Literal["add", "update", "delete"]


class Increment(BaseModel):
    title: str | None = None  # Optional for "delete"
    doc_text: str | None = None  # Optional for "delete"
    action: IncrementalAction
    doc_id: str | None = None  # Optional for "add", required for "update" and "delete"

    @model_validator(mode="after")
    def check_doc_id(self):
        if self.action in ["update", "delete"] and not self.doc_id:
            raise ValueError("doc_id is required for update and delete actions")
        # If add and update, title and doc_text are required
        if self.action in ["add", "update"] and (not self.title or not self.doc_text):
            raise ValueError(
                "title and doc_text are required for add and update actions"
            )
        return self
