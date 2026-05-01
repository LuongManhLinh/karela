"""Taxonomy bucketing service — orchestrates LLM-driven story categorization."""

from sqlalchemy.orm import Session

from common.schemas import StoryMinimal

from .schemas import TaxonomyResponse, NewBucket, BucketUpdate, StoryCategorization
from .agents.graph import run_taxonomy_graph
from .query import (
    get_story_tags as _get_story_tags,
    get_stories_by_tags as _get_stories_by_tags,
    get_all_buckets,
    upsert_buckets_and_items,
    drop_all_buckets,
    get_project_stories_tags,
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
        project_context: str = "",
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

        final_state = run_taxonomy_graph(
            user_stories=stories,
            current_taxonomy=[],
            project_description=project_context,
            connection_id=connection_id,
            project_key=project_key,
            is_update=False,
            seed_strategy=seed_strategy,
            seed_size=seed_size,
            extension_batch_size=extension_batch_size,
        )

        self._persist_state(connection_id, project_key, final_state)

    def update_buckets(
        self,
        connection_id: str,
        project_key: str,
        stories: list[StoryMinimal],
        project_context: str = "",
        extension_batch_size: int = 20,
    ) -> None:
        """Incremental update: concurrent extension batches via graph.

        Works for both a single new story (TARGETED) and batches.
        """
        if not stories:
            return

        db_buckets = get_all_buckets(self.db, connection_id, project_key)
        current_taxonomy = [
            {"name": b.tag, "description": b.description or ""} for b in db_buckets
        ]

        final_state = run_taxonomy_graph(
            user_stories=stories,
            current_taxonomy=current_taxonomy,
            project_description=project_context,
            connection_id=connection_id,
            project_key=project_key,
            is_update=True,
            extension_batch_size=extension_batch_size,
        )

        self._persist_state(connection_id, project_key, final_state)

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
        final_state: dict,
    ):
        """Persist graph results: taxonomy updates + categorizations."""
        draft = final_state.get("draft_taxonomy_updates", {})
        extension_results = final_state.get("extension_results", [])

        # Collect all new_buckets and bucket_updates
        all_new_buckets = [NewBucket(**b) for b in draft.get("new_buckets", [])]
        all_bucket_updates = [BucketUpdate(**b) for b in draft.get("bucket_updates", [])]

        for result in extension_results:
            if result:
                all_new_buckets.extend([NewBucket(**b) for b in result.get("new_buckets", [])])
                all_bucket_updates.extend([BucketUpdate(**b) for b in result.get("bucket_updates", [])])

        # Collect categorizations
        raw_cats = final_state.get("categorizations", [])
        categorizations = [
            StoryCategorization(**c) if isinstance(c, dict) else c
            for c in raw_cats
        ]

        output = TaxonomyResponse(
            categorizations=categorizations,
            new_buckets=all_new_buckets,
            bucket_updates=all_bucket_updates,
        )

        upsert_buckets_and_items(self.db, connection_id, project_key, output)

        print(
            f"| Taxonomy persisted — {len(output.new_buckets)} new buckets, "
            f"{len(output.bucket_updates)} updates, "
            f"{len(output.categorizations)} categorizations"
        )
