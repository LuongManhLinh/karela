"""ALL (batch) analysis workflow entry point.

Scans all user stories in the project for self-defects and uses
GraphRAG community detection to chunk pairwise analysis efficiently.
"""

from common.schemas import StoryMinimal

from ..schemas import BucketGroup, DefectByLlm
from .state import AllState, AllContext
from .graph import build_all_graph
from sqlalchemy.orm import Session
from common.database import get_db

# Build the compiled graph at module level
_graph = build_all_graph()


def run_analysis(
    connection_id: str,
    project_key: str,
    info_provided: bool = False,
    all_stories: list[StoryMinimal] = None,
    bucket_groups: list[BucketGroup] = None,
    db: Session | None = None,
    extra_instruction: str = None,
    existing_defects: list[DefectByLlm] = None,
    self_batch_size: int = 20,
    self_concurrent_batches: int | None = None,
    pairwise_concurrent_batches: int | None = None,
    project_description: str | None = None,
    group_pairwise_batches: bool | None = True,
) -> list[DefectByLlm]:
    """Run the ALL (batch) defect detection workflow on all project stories.

    This workflow:
    1. Gathers project context in parallel with mapping all GraphRAG communities.
    2. Runs batch self-defect analysis on all stories, intra-community pairwise
       analysis on each community, and inter-community global search - all in parallel.
    3. Validates and filters all detected defects to remove false positives.

    Args:
        connection_id: The connection ID for the project data sources.
        project_key: The Jira/project key.
        extra_instruction: Optional extra instructions to append to agent prompts.

    Returns:
        A list of validated DefectByLlm objects representing confirmed defects.
    """
    if info_provided and (not all_stories or not bucket_groups):
        raise ValueError(
            "If info_provided is True, all_stories and bucket_groups must be provided."
        )

    initial_state: AllState = {
        "project_context": "",
        "communities": [],
        "raw_defects": [],
        "final_defects": [],
        "all_stories": all_stories or [],
        "bucket_groups": bucket_groups or [],
        "info_provided": info_provided,
    }

    context = AllContext(
        db=db or next(get_db()),
        connection_id=connection_id,
        project_key=project_key,
        extra_instruction=extra_instruction,
        existing_defects=existing_defects or [],
        self_batch_size=self_batch_size,
        self_concurrent_batches=self_concurrent_batches,
        pairwise_concurrent_batches=pairwise_concurrent_batches,
        project_description=project_description,
        group_pairwise_batches=group_pairwise_batches,
    )

    final_state = _graph.invoke(initial_state, context=context)

    if isinstance(final_state, dict):
        return final_state.get("final_defects", [])

    return final_state.final_defects if hasattr(final_state, "final_defects") else []
