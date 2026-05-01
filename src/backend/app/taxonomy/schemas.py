from typing import Literal

from pydantic import BaseModel, Field, ConfigDict


class StoryCategorization(BaseModel):
    """Maps a single user story to its assigned bucket tags."""

    key: str = Field(description="The user story key (e.g., 'VBS-1')")
    tags: list[str] = Field(
        description="List of bucket/tag names this story belongs to"
    )

    model_config = ConfigDict(extra="ignore")


class NewBucket(BaseModel):
    """A newly proposed bucket that doesn't exist in the current taxonomy."""

    name: str = Field(description="Short, descriptive name for the bucket")
    description: str = Field(
        description="What business domain or concern this bucket covers"
    )

    model_config = ConfigDict(extra="ignore")


class BucketUpdate(BaseModel):
    """An update to an existing bucket's description."""

    name: str = Field(description="Name of the existing bucket to update")
    updated_description: str = Field(description="The revised description")
    reason: str = Field(description="Why the description needs updating")

    model_config = ConfigDict(extra="ignore")


class TaxonomyUpdateResponse(BaseModel):
    """Structured response schema for Pass 1: Generating/Updating taxonomy."""

    reasoning: str = Field(
        description="Chain-of-thought reasoning explaining why new buckets or updates are needed."
    )
    new_buckets: list[NewBucket] = Field(
        default_factory=list,
        description="New buckets proposed for stories that don't fit existing ones",
    )
    bucket_updates: list[BucketUpdate] = Field(
        default_factory=list,
        description="Updates to existing bucket descriptions based on new insights",
    )

    model_config = ConfigDict(extra="ignore")


class TaxonomyCategorizationResponse(BaseModel):
    """Structured response schema for Pass 2: Categorizing stories."""

    reasoning: str = Field(
        description="Chain-of-thought reasoning explaining the categorization mapping."
    )
    categorizations: list[StoryCategorization] = Field(
        description="Categorization of each input story into existing or new buckets"
    )

    model_config = ConfigDict(extra="ignore")

class TaxonomyValidationDecision(BaseModel):
    """Validation decision for a single extraction batch."""

    batch_index: int = Field(description="Index of the batch this decision applies to (0-based)")
    status: Literal["VALID", "INVALID", "ADJUSTED"] = Field(
        description="VALID: keep as-is. INVALID: too many inappropriate tags, re-extract. ADJUSTED: apply corrections below."
    )
    reasoning: str = Field(description="Why this decision was made")
    adjusted_new_buckets: list[NewBucket] = Field(
        default_factory=list,
        description="Corrected new_buckets (only when status is ADJUSTED)",
    )
    adjusted_bucket_updates: list[BucketUpdate] = Field(
        default_factory=list,
        description="Corrected bucket_updates (only when status is ADJUSTED)",
    )

    model_config = ConfigDict(extra="ignore")


class TaxonomyValidationResponse(BaseModel):
    """Structured response from the taxonomy validator agent."""

    reasoning: str = Field(
        description="Overall chain-of-thought reasoning about the proposed taxonomy changes."
    )
    decisions: list[TaxonomyValidationDecision] = Field(
        description="Per-batch validation decisions"
    )

    model_config = ConfigDict(extra="ignore")


class TaxonomyResponse(BaseModel):
    """Structured response schema for the taxonomy agent.

    Handles all three operations in a single response:
    categorization, bucket creation, and bucket description updates.
    """

    categorizations: list[StoryCategorization] = Field(
        description="Categorization of each input story into existing or new buckets"
    )
    new_buckets: list[NewBucket] = Field(
        default_factory=list,
        description="New buckets proposed for stories that don't fit existing ones",
    )
    bucket_updates: list[BucketUpdate] = Field(
        default_factory=list,
        description="Updates to existing bucket descriptions based on new insights",
    )

    model_config = ConfigDict(extra="ignore")
