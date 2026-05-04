"""State and Context definitions for the TARGETED analysis workflow."""

from ..schemas import StoryMinimal
from ..shared_state import AnalysisState, AnalysisContext


class TargetedState(AnalysisState):
    """LangGraph state for the TARGETED defect detection workflow.

    This workflow analyzes a single target user story for self-defects
    and compares it against related stories for pairwise defects.
    """

    # The user story being analyzed
    target_story: StoryMinimal

    # Related stories found via GraphRAG (populated by Relational Graph Search)
    related_stories: list[StoryMinimal]


class TargetedContext(AnalysisContext):
    pass
