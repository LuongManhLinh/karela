"""Taxonomy bucketing service — orchestrates LLM-driven story categorization."""

from sqlalchemy.orm import Session
from langchain_core.messages import HumanMessage

from app.analysis.agents.schemas import UserStoryMinimal
from app.analysis.agents.utils import format_stories

from .agents import default_extension_agent, default_seed_agent
from .schemas import TaxonomyResponse
from .prompts import SEED_MESSAGE, EXTENSION_MESSAGE
from .fake_history import SEED_FEW_SHOT, EXTENSION_FEW_SHOT
from .query import (
    get_story_tags as _get_story_tags,
    get_stories_by_tags as _get_stories_by_tags,
    get_all_buckets,
    upsert_buckets_and_items,
    drop_all_buckets,
)

SEED_BATCH_SIZE = 50
EXTENSION_BATCH_SIZE = 20


def _format_taxonomy(buckets) -> str:
    """Format current buckets into a text block for the extension prompt."""
    if not buckets:
        return "No taxonomy exists yet."
    lines = []
    for b in buckets:
        lines.append(f"- **{b.tag}**: {b.description or 'No description'}")
    return "\n".join(lines)


class TaxonomyService:
    def __init__(
        self,
        db: Session,
        seed_agent=default_seed_agent,
        extension_agent=default_extension_agent,
    ):
        self.db = db
        self.seed_agent = seed_agent
        self.extension_agent = extension_agent

    # -----------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------

    def initialize_buckets(
        self,
        connection_id: str,
        project_key: str,
        stories: list[UserStoryMinimal],
        project_context: str = "",
    ):
        """Full initialization: seed batch → extension batches.

        Drops existing taxonomy, processes the first batch as seed,
        then processes remaining batches as extensions.
        """
        if not stories:
            return

        drop_all_buckets(self.db, connection_id, project_key)

        seed_batch = stories[:SEED_BATCH_SIZE]
        self._run_seed(connection_id, project_key, seed_batch, project_context)

        extension_batches = [
            stories[i : i + EXTENSION_BATCH_SIZE]
            for i in range(SEED_BATCH_SIZE, len(stories), EXTENSION_BATCH_SIZE)
        ]

        for batch in extension_batches:
            self._run_extension(connection_id, project_key, batch, project_context)

    def update_buckets(
        self,
        connection_id: str,
        project_key: str,
        stories: list[UserStoryMinimal],
        project_context: str = "",
    ) -> None:
        """Incremental update: run extension agent for new stories.

        Works for both a single new story (TARGETED) and small batches.
        """
        if not stories:
            return

        extension_batches = [
            stories[i : i + EXTENSION_BATCH_SIZE]
            for i in range(0, len(stories), EXTENSION_BATCH_SIZE)
        ]
        for batch in extension_batches:
            self._run_extension(connection_id, project_key, batch, project_context)

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

    # -----------------------------------------------------------------
    # Internal
    # -----------------------------------------------------------------

    def _run_seed(
        self,
        connection_id: str,
        project_key: str,
        stories: list[UserStoryMinimal],
        project_context: str,
    ):
        """Run the seed agent on the first batch and persist results."""
        print(f"\n{'='*80}\n| Taxonomy Seed — {len(stories)} stories\n{'='*80}")

        stories_text = format_stories(stories)
        msg = SEED_MESSAGE.format(
            project_context=project_context or "N/A",
            stories=stories_text,
        )

        messages = SEED_FEW_SHOT + [HumanMessage(content=msg)]
        response = self.seed_agent.invoke(messages)

        output: TaxonomyResponse = response["structured_response"]
        upsert_buckets_and_items(self.db, connection_id, project_key, output)

        print(
            f"| Seed complete — {len(output.new_buckets)} buckets, "
            f"{len(output.categorizations)} categorizations"
        )

    def _run_extension(
        self,
        connection_id: str,
        project_key: str,
        stories: list[UserStoryMinimal],
        project_context: str,
    ) -> None:
        """Run the extension agent and persist results."""
        print(f"\n{'='*80}\n| Taxonomy Extension — {len(stories)} stories\n{'='*80}")

        buckets = get_all_buckets(self.db, connection_id, project_key)
        taxonomy_text = _format_taxonomy(buckets)
        stories_text = format_stories(stories)

        msg = EXTENSION_MESSAGE.format(
            project_context=project_context or "N/A",
            existing_taxonomy=taxonomy_text,
            stories=stories_text,
        )

        messages = EXTENSION_FEW_SHOT + [HumanMessage(content=msg)]
        response = self.extension_agent.invoke(messages)

        output: TaxonomyResponse = response["structured_response"]
        upsert_buckets_and_items(self.db, connection_id, project_key, output)

        print(
            f"| Extension complete — {len(output.new_buckets)} new buckets, "
            f"{len(output.bucket_updates)} updates, "
            f"{len(output.categorizations)} categorizations"
        )
