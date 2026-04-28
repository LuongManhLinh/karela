"""State and Context definitions for the TARGETED analysis workflow."""

import operator
from typing import Optional, Annotated
from typing_extensions import TypedDict

from .schemas import DefectByLlm
from common.agents.schemas import LlmContext


class AnalysisState(TypedDict):
    """LangGraph shared state for defect detection workflows."""

    # Summarized project guidelines/rules (populated by Context Gatherer)
    project_context: str

    # Accumulated raw defects from parallel analyzers (uses reducer for parallel writes)
    raw_defects: Annotated[list[DefectByLlm], operator.add]

    # Final validated and filtered defects
    final_defects: list[DefectByLlm]


class AnalysisContext(LlmContext):
    extra_instruction: Optional[str] = None
    existing_defects: list[DefectByLlm] = None
