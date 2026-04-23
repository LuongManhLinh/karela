from pydantic import BaseModel, Field


class SingleDefectOutput(BaseModel):
    defect_type: str = Field(..., description="The type of defect identified")
    explanation: str = Field(..., description="A concise explanation of the defect")
    severity: str = Field(
        ..., description="The severity level of the defect (HIGH, MEDIUM, LOW)"
    )
    confidence_score: float = Field(
        ...,
        description="A score from 0.0 to 1.0 representing the confidence in this assessment",
    )


class SingleDefectCaseOutput(BaseModel):
    case_id: int = Field(..., description="The unique identifier for the case")
    story_key: str = Field(..., description="The key of the user story being evaluated")
    defects: list[SingleDefectOutput] = Field(
        ..., description="A list of valid defects identified for this story"
    )


class SingleDefectResponse(BaseModel):
    valid_defects: list[SingleDefectCaseOutput] = Field(
        ...,
        description="An array of cases with their valid defects. Empty if no valid defects found.",
    )


class PairwiseDefectOutput(BaseModel):
    story_key: str = Field(
        ..., description="The key of the satellite story being compared"
    )
    defect_type: str = Field(..., description="The type of defect identified")
    explanation: str = Field(..., description="A concise explanation of the defect")
    severity: str = Field(
        ..., description="The severity level of the defect (HIGH, MEDIUM, LOW)"
    )
    confidence_score: float = Field(
        ...,
        description="A score from 0.0 to 1.0 representing the confidence in this assessment",
    )


class PairwiseDefectCaseOutput(BaseModel):
    case_id: int = Field(..., description="The unique identifier for the case")
    anchor_story_key: str = Field(..., description="The key of the anchor story")
    satellite_defects: list[PairwiseDefectOutput] = Field(
        ...,
        description="A list of valid defects identified for each satellite story compared to the anchor",
    )


class PairwiseDefectResponse(BaseModel):
    valid_defects: list[PairwiseDefectCaseOutput] = Field(
        ...,
        description="An array of cases with their valid pairwise defects. Empty if no valid defects found.",
    )
