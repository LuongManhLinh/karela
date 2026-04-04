from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from ..schemas import UserStoryMinimal, DefectByLlm


class CrossCheckInput(BaseModel):
    user_stories: list[UserStoryMinimal] = []
    existing_defects: list[DefectByLlm] = []


class CrossCheckTargetedInput(CrossCheckInput):
    target_user_story: UserStoryMinimal


class SingleCheckInput(CrossCheckInput):
    existing_defects: list[DefectByLlm] = []


class SingleCheckTargetedInput(SingleCheckInput):
    target_user_story: UserStoryMinimal


class ValidateDefectsInput(BaseModel):
    """Input for defect validation node."""

    user_stories: list[UserStoryMinimal] = Field(
        description="Original user stories being analyzed."
    )
    defects: list[DefectByLlm] = Field(description="Detected defects to be validated.")


class ValidateDefectsTargetedInput(ValidateDefectsInput):
    target_user_story: UserStoryMinimal = Field(
        description="Target user story being analyzed."
    )


class DefectValidation(BaseModel):
    """Validation result for a single defect."""

    defect_key: str = Field(description="The key of the defect being validated")
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


class ValidateDefectsOutput(BaseModel):
    """Output from defect validation node."""

    validations: list[DefectValidation] = Field(
        description="Validation results for each defect."
    )


class FilterDefectsInput(BaseModel):
    """Input for defect filtering node."""

    defects: list[DefectByLlm] = Field(description="Validated defects to be filtered.")


class DefectFilterDecision(BaseModel):
    """Filter decision for a single defect."""

    defect_key: str = Field(description="The key of the defect being validated")
    should_include: bool = Field(
        description="Whether to include this defect in final results."
    )
    reasoning: str = Field(description="Brief explanation for the filtering decision.")


class FilterDefectsOutput(BaseModel):
    """Output from defect filtering node."""

    filter_decisions: list[DefectFilterDecision] = Field(
        description="Filter decisions for each defect."
    )
