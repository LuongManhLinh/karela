from pydantic import BaseModel
from typing import List, Optional, TypedDict, Callable
from ...schemas import WorkItemMinimal, DefectByLlm
from ...input_schemas import ContextInput


class CrossCheckInput(BaseModel):
    user_stories: List[WorkItemMinimal] = []
    existing_defects: List[DefectByLlm] = []


class SingleCheckInput(CrossCheckInput):
    context_input: Optional[ContextInput] = None
