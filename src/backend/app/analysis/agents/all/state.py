"""State and Context definitions for the ALL analysis workflow."""

from ..schemas import BucketGroup, StoryMinimal
from ..shared_state import AnalysisState, AnalysisContext


class AllState(AnalysisState):
    """LangGraph state for the ALL (batch) defect detection workflow.

    This workflow scans all user stories in the project, using GraphRAG
    communities to chunk the workload for pairwise analysis.
    """

    all_stories: list[StoryMinimal]
    bucket_groups: list[BucketGroup]


class AllContext(AnalysisContext):
    self_batch_size: int = 20
    self_concurrent_batches: int | None = None
    pairwise_concurrent_batches: int | None = None
