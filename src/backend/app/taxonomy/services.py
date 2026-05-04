"""Taxonomy bucketing service - orchestrates LLM-driven story categorization."""

from sqlalchemy.orm import Session

from common.schemas import StoryMinimal
from typing import Literal

from .schemas import NewBucket, StoryCategorization
from .agents.graph import run_taxonomy_graph
from .query import (
    get_story_tags as _get_story_tags,
    get_stories_by_tags as _get_stories_by_tags,
    get_all_buckets,
    upsert_buckets_and_items,
    drop_all_buckets,
    get_project_stories_tags,
    delete_buckets_by_story_keys,
)


class TaxonomyService:
    def __init__(self, db: Session):
        self.db = db

    # -----------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------

    def initialize_buckets(
        self,
        connection_id: str,
        project_key: str,
        stories: list[StoryMinimal],
        project_description: str = "",
        seed_strategy: str = "hybrid",
        seed_size: int = 50,
        extension_batch_size: int = 20,
    ):
        """Full initialization: seed + concurrent extension batches via graph.

        Drops existing taxonomy, then delegates all batching to the graph.
        """
        if not stories:
            return

        drop_all_buckets(self.db, connection_id, project_key)

        buckets, categorizations = run_taxonomy_graph(
            user_stories=stories,
            current_taxonomy=[],
            project_description=project_description,
            connection_id=connection_id,
            project_key=project_key,
            is_update=False,
            seed_strategy=seed_strategy,
            seed_size=seed_size,
            extension_batch_size=extension_batch_size,
        )

        self._persist_state(connection_id, project_key, buckets, categorizations)

    def update_buckets(
        self,
        connection_id: str,
        project_key: str,
        stories: list[StoryMinimal],
        project_description: str = "",
        extension_batch_size: int = 20,
    ) -> None:
        """Incremental update: concurrent extension batches via graph.

        Works for both a single new story (TARGETED) and batches.
        """
        if not stories:
            return

        db_buckets = get_all_buckets(self.db, connection_id, project_key)
        current_taxonomy = [
            NewBucket(name=b.tag, description=b.description or "") for b in db_buckets
        ]

        all_bucket, categorizations = run_taxonomy_graph(
            user_stories=stories,
            current_taxonomy=current_taxonomy,
            project_description=project_description,
            connection_id=connection_id,
            project_key=project_key,
            is_update=True,
            extension_batch_size=extension_batch_size,
        )

        self._persist_state(connection_id, project_key, all_bucket, categorizations)

    def delete_buckets_by_story_keys(
        self, connection_id: str, project_key: str, story_keys: list[str]
    ) -> None:
        """Delete buckets associated with any of the given story keys."""
        delete_buckets_by_story_keys(self.db, connection_id, project_key, story_keys)

    def get_story_tags(
        self, connection_id: str, project_key: str, story_key: str
    ) -> list[str]:
        """Return bucket tag names for a specific story."""
        return _get_story_tags(self.db, connection_id, project_key, story_key)

    def get_story_keys_related_to_tags(
        self, connection_id: str, project_key: str, tags: list[str]
    ) -> list[str]:
        """Return unique story keys belonging to any of the given tags."""
        return _get_stories_by_tags(self.db, connection_id, project_key, tags)

    def drop_buckets(self, connection_id: str, project_key: str) -> None:
        """Delete all taxonomy data for a project."""
        drop_all_buckets(self.db, connection_id, project_key)

    def get_project_stories_tags(self, connection_id: str, project_key: str):
        return get_project_stories_tags(self.db, connection_id, project_key)

    # -----------------------------------------------------------------
    # Internal
    # -----------------------------------------------------------------

    def _persist_state(
        self,
        connection_id: str,
        project_key: str,
        all_bucket: list[NewBucket],
        categorizations: list[StoryCategorization],
    ):
        """Persist graph results: taxonomy updates + categorizations."""
        upsert_buckets_and_items(
            self.db, connection_id, project_key, all_bucket, categorizations
        )
