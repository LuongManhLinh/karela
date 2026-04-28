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
