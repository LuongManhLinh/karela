from typing import Literal, Optional

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


class TaxonomyDraft(BaseModel):
    """A draft taxonomy update holding new buckets and description updates."""

    new_buckets: list[NewBucket] = Field(default_factory=list)
    bucket_updates: list[BucketUpdate] = Field(default_factory=list)

    model_config = ConfigDict(extra="ignore")


class TaxonomySeedResponse(BaseModel):
    """Structured response schema for seeding the initial taxonomy."""

    reasoning: str = Field(
        description="Chain-of-thought reasoning explaining the proposed initial taxonomy."
    )
    new_buckets: list[NewBucket] = Field(
        description="Initial buckets proposed to cover the provided user stories"
    )

    model_config = ConfigDict(extra="ignore")


class TaxonomyUpdateResponse(BaseModel):
    """Structured response schema for Pass 1: Generating/Updating taxonomy."""

    reasoning: str = Field(
        description="Chain-of-thought reasoning explaining why new buckets or updates are needed."
    )
    new_buckets: list[NewBucket] = Field(
        description="New buckets proposed for stories that don't fit existing ones",
    )
    bucket_updates: list[BucketUpdate] = Field(
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


class TaxonomyValidationResponse(BaseModel):
    """Validation decision for a single extraction batch."""

    status: Literal["VALID", "INVALID", "ADJUSTED"] = Field(
        description="VALID: keep as-is. INVALID: too many inappropriate tags, re-extract. ADJUSTED: apply corrections below."
    )
    reasoning: str = Field(description="Why this decision was made")
    adjusted_new_buckets: list[NewBucket] = Field(
        description="Corrected new_buckets (only when status is ADJUSTED)",
    )
    adjusted_bucket_updates: list[BucketUpdate] = Field(
        description="Corrected bucket_updates (only when status is ADJUSTED)",
    )

    model_config = ConfigDict(extra="ignore")


class SeedValidationResponse(BaseModel):
    """Structured response from the seed taxonomy validator.

    Simplified: no batch_index (only one batch), no bucket_updates
    (seeding creates from scratch - no existing buckets to update).
    """

    reasoning: str = Field(
        description="Chain-of-thought reasoning about the proposed initial taxonomy."
    )
    status: Literal["VALID", "INVALID", "ADJUSTED"] = Field(
        description="VALID: keep as-is. INVALID: fundamentally wrong, re-extract. ADJUSTED: apply corrected buckets below."
    )
    adjusted_new_buckets: Optional[list[NewBucket]] = Field(
        description="Corrected bucket list (only when status is ADJUSTED)",
    )

    model_config = ConfigDict(extra="ignore")
