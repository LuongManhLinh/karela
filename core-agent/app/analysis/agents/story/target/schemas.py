from pydantic import BaseModel
from typing import List, Optional, TypedDict, Callable
from ...schemas import WorkItemMinimal, DefectByLlm
from ...input_schemas import ContextInput


class CrossCheckInput(BaseModel):
    user_stories: List[WorkItemMinimal]
    existing_defects: List[DefectByLlm]
    target_user_story: WorkItemMinimal


class SingleCheckInput(BaseModel):
    target_user_story: WorkItemMinimal
    existing_defects: List[DefectByLlm]
    context_input: ContextInput
