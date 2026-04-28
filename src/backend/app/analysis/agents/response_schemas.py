"""Response schemas for agent nodes requiring structured JSON output."""

from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


# =============================================================================
# Self-Defect Analyzer Response
# =============================================================================


class SelfDefectItem(BaseModel):
    """A single self-defect detected on one user story."""

    type: str = Field(
        description=(
            "The defect type. One of: NOT_INDEPENDENT, "
            "NOT_VALUABLE, NOT_ESTIMABLE, NOT_SMALL"
        ),
    )
    story_key: str = Field(
        description="The key of the user story that has this defect",
    )
    severity: str = Field(
        description="Severity level: 'HIGH', 'MEDIUM', or 'LOW'",
    )
    explanation: str = Field(
        description="A concise explanation of why this defect was identified",
    )
    confidence: float = Field(
        description="Confidence score from 0.0 to 1.0",
    )
    suggested_fix: str = Field(
        description="Actionable suggestion for how to fix this defect",
    )

    model_config = ConfigDict(extra="ignore")


class SelfDefectResponse(BaseModel):
    """Response schema for the Self-Defect Analyzer agent."""

    defects: list[SelfDefectItem] = Field(
        description="List of self-defects found. Empty if no defects detected.",
    )

    model_config = ConfigDict(extra="ignore")


# =============================================================================
# Pairwise Defect Analyzer Response
# =============================================================================


class PairwiseDefectItem(BaseModel):
    """A single pairwise defect detected between two user stories."""

    type: str = Field(
        description="The defect type. One of: CONFLICT, DUPLICATION",
    )
    story_key_a: str = Field(
        description="The key of the first story involved in this defect",
    )
    story_key_b: str = Field(
        description="The key of the second story involved in this defect",
    )
    severity: str = Field(
        description="Severity level: 'HIGH', 'MEDIUM', or 'LOW'",
    )
    explanation: str = Field(
        description="A concise explanation of why these stories conflict or duplicate",
    )
    confidence: float = Field(
        description="Confidence score from 0.0 to 1.0",
    )
    suggested_fix: str = Field(
        description="Actionable suggestion for resolving this pairwise defect",
    )

    model_config = ConfigDict(extra="ignore")


class PairwiseDefectResponse(BaseModel):
    """Response schema for the Pairwise Defect Analyzer agent."""

    defects: list[PairwiseDefectItem] = Field(
        default_factory=list,
        description="List of pairwise defects found. Empty if no defects detected.",
    )

    model_config = ConfigDict(extra="ignore")


# =============================================================================
# Defect Validator & Formatter Response
# =============================================================================


class ValidatedDefectItem(BaseModel):
    """A defect that has been reviewed by the validator."""

    original_index: int = Field(
        description="The 0-based index of this defect in the raw_defects input list",
    )
    status: Literal["VALID", "INVALID", "ADJUSTED"] = Field(
        description=("One of: [VALID, INVALID, ADJUSTED]."),
    )
    reasoning: Optional[str] = Field(
        description="Brief explanation for the status decision, especially if INVALID or ADJUSTED",
    )
    adjusted_severity: Optional[str] = Field(
        description="Corrected severity if status is ADJUSTED (HIGH/MEDIUM/LOW)",
    )
    adjusted_explanation: Optional[str] = Field(
        description="Improved explanation if status is ADJUSTED",
    )

    model_config = ConfigDict(extra="ignore")


class ValidatorResponse(BaseModel):
    """Response schema for the Defect Validator & Formatter agent."""

    validated_defects: list[ValidatedDefectItem] = Field(
        default_factory=list,
        description="Validation results for each raw defect",
    )

    model_config = ConfigDict(extra="ignore")


# =============================================================================
# Dependency Matrix Response
# =============================================================================


class DependencyDefectItem(BaseModel):
    """A dependency-related defect found by analyzing the dependency graph."""

    story_keys: list[str] = Field(
        description=(
            "Keys of all stories involved in this dependency defect. "
            "For circular dependencies, list all stories in the cycle. "
            "For bottlenecks, list the blocking story first, then the stories it blocks."
        ),
    )
    type: str = Field(
        description="The specific dependency issue: 'CIRCULAR_DEPENDENCY' or 'EXTREME_BOTTLENECK'",
    )
    severity: str = Field(
        description="Severity level: 'HIGH', 'MEDIUM', or 'LOW'",
    )
    explanation: str = Field(
        description="A concise explanation of the dependency issue",
    )
    confidence: float = Field(
        description="Confidence score from 0.0 to 1.0",
    )
    suggested_fix: str = Field(
        description="Actionable suggestion for resolving this dependency issue",
    )

    model_config = ConfigDict(extra="ignore")


class DependencyMatrixResponse(BaseModel):
    """Response schema for the Dependency Matrix agent."""

    defects: list[DependencyDefectItem] = Field(
        default_factory=list,
        description="List of dependency defects found. Empty if no issues detected.",
    )

    model_config = ConfigDict(extra="ignore")
