from typing import Literal, Optional
from typing_extensions import TypedDict
from common.schemas import StoryMinimal
from common.agents.schemas import LlmContext

from ..schemas import NewBucket, StoryCategorization, TaxonomyDraft


class TaxonomyState(TypedDict):
    """LangGraph state for the taxonomy generation workflow."""

    # All stories and batching
    all_stories: list[StoryMinimal]
    seed_stories: list[StoryMinimal]
    extension_batches: list[list[StoryMinimal]]

    # Taxonomy state
    current_taxonomy: list[NewBucket]
    seed_results: list[NewBucket]
    final_taxonomy: list[NewBucket]

    # Extension batch processing
    extension_results: list[TaxonomyDraft]
    failed_extension_indices: list[int]

    # Categorizations
    categorizations: list[StoryCategorization]

    # Control flow
    errors: list[str]
    extension_errors: dict[int, str]  # batch index -> error message
    iterations: int
    project_context: str


class TaxonomyContext(LlmContext):
    user_stories: list[StoryMinimal]
    project_description: Optional[str] = None
    is_update: bool = False
    seed_strategy: Literal["first", "random", "hybrid"] = "hybrid"
    seed_size: int = 50
    seed_hybrid_first_pct: float = 0.6
    extension_batch_size: int = 20
