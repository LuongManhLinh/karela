"""TARGETED analysis workflow entry point.

Analyzes a single user story for self-defects and compares it
against related stories (discovered via GraphRAG) for pairwise defects.
"""

from common.database import get_db

from ..schemas import StoryMinimal, DefectByLlm
from .state import TargetedState, TargetedContext
from .graph import build_targeted_graph
from sqlalchemy.orm import Session

# Build the compiled graph at module level
_graph = build_targeted_graph()


def run_analysis(
    target_user_story: StoryMinimal,
    connection_id: str,
    project_key: str,
    db: Session | None = None,
    existing_defects: list[DefectByLlm] = None,
    extra_instruction: str = None,
    project_description: str | None = None,
) -> list[DefectByLlm]:
    """Run the TARGETED defect detection workflow on a single user story.

    This workflow:
    1. Gathers project context (docs, NFRs, scope) in parallel with
       finding related stories via GraphRAG community search.
    2. Analyzes the target story for self-defects (INVEST criteria) and
       pairwise defects (conflicts/duplications with related stories) in parallel.
    3. Validates and filters detected defects to remove false positives.

    Args:
        target_user_story: The user story to analyze.
        connection_id: The connection ID for the project data sources.
        project_key: The Jira/project key.
        extra_instruction: Optional extra instructions to append to agent prompts.

    Returns:
        A list of validated DefectByLlm objects representing confirmed defects.
    """
    initial_state: TargetedState = {
        "target_story": target_user_story,
        "project_context": "",
        "related_stories": [],
        "raw_defects": [],
        "final_defects": [],
    }

    context = TargetedContext(
        connection_id=connection_id,
        project_key=project_key,
        db=db or next(get_db()),
        extra_instruction=extra_instruction,
        existing_defects=existing_defects,
        project_description=project_description,
    )

    final_state = _graph.invoke(initial_state, context=context)

    if isinstance(final_state, dict):
        return final_state.get("final_defects", [])

    return final_state.final_defects if hasattr(final_state, "final_defects") else []
