from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from ..schemas import WorkItemMinimal, DefectByLlm
from common.agents.input_schemas import ContextInput


class CrossCheckInput(BaseModel):
    user_stories: List[WorkItemMinimal]
    existing_defects: List[DefectByLlm]
    target_user_story: WorkItemMinimal


class SingleCheckInput(BaseModel):
    target_user_story: WorkItemMinimal
    existing_defects: List[DefectByLlm]
    context_input: ContextInput


class DefectValidation(BaseModel):
    """Validation result for a single defect."""

    defect_index: int = Field(
        description="Index of the defect being validated (0-based)."
    )
    status: Literal["VALID", "INVALID", "NEEDS_CLARIFICATION"] = Field(
        description="Validation status of the defect."
    )
    reasoning: str = Field(description="Explanation for the validation decision.")
    suggested_severity: Optional[str] = Field(
        None, description="Corrected severity if NEEDS_CLARIFICATION (LOW/MEDIUM/HIGH)."
    )
    suggested_explanation: Optional[str] = Field(
        None, description="Improved explanation if NEEDS_CLARIFICATION."
    )


class ValidateDefectsInput(BaseModel):
    """Input for defect validation node."""

    target_user_story: WorkItemMinimal = Field(
        description="Target user story being analyzed."
    )
    user_stories: List[WorkItemMinimal] = Field(
        description="Related user stories for context."
    )
    defects: List[DefectByLlm] = Field(description="Detected defects to be validated.")
    context_input: Optional[ContextInput] = Field(
        None, description="Project context for validation."
    )


class ValidateDefectsOutput(BaseModel):
    """Output from defect validation node."""

    validations: List[DefectValidation] = Field(
        description="Validation results for each defect."
    )


class DefectFilterDecision(BaseModel):
    """Filter decision for a single defect."""

    defect_index: int = Field(
        description="Index of the defect being evaluated (0-based)."
    )
    should_include: bool = Field(
        description="Whether to include this defect in final results."
    )
    reasoning: str = Field(description="Brief explanation for the filtering decision.")


class FilterDefectsInput(BaseModel):
    """Input for defect filtering node."""

    defects: List[DefectByLlm] = Field(description="Validated defects to be filtered.")


class FilterDefectsOutput(BaseModel):
    """Output from defect filtering node."""

    filter_decisions: List[DefectFilterDecision] = Field(
        description="Filter decisions for each defect."
    )
