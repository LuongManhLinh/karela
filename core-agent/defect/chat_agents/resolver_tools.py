from langchain.tools import tool, ToolRuntime
from typing import Optional
import json

from ..services import DefectDataService, DefectRunService
from ..tasks import analyze_target_user_story
from common.redis_app import task_queue


@tool
def get_defects(story_key: Optional[str], runtime: ToolRuntime) -> str:
    """Fetch defects for a User Story by its ID.

    Args:
        story_key (Optional[str]):
            The key of the User Story to fetch defects for.
            If None, use story_key from current context.

    Returns:
        str: A summary of defects associated with the Story.
    """

    if not story_key:
        story_key = runtime.state.get("story_key", None)

        if not story_key:
            return "No story_key provided or found in context. Cannot fetch defects."

    db = runtime.state.get("db_session")
    if not db:
        return "Database session not found in context. Cannot fetch defects."
    defects = DefectDataService.get_defects_by_work_item(db, story_key)

    if not defects:
        return "No defects found for the provided story_key."

    return f"Defects found:\n{json.dumps(defects, indent=2)}"


@tool
def run_defect_analysis(story_key: str, runtime: ToolRuntime) -> str:
    """Run a defect analysis for a User Story.

    Args:
        story_key (str): The key of the Story to run defect analysis for.

    Returns:
        str: The result of the defect analysis.
    """

    db = runtime.state.get("db_session")
    if not db:
        return "Database session not found in context. Cannot run defect analysis."
    project_key = runtime.state.get("project_key")
    if not project_key:
        return "Project key not found in context. Cannot run defect analysis."
    analysis_id = DefectDataService.init_analysis(
        db, project_key=project_key, analysis_type="TARGETED"
    )

    task_queue.enqueue(analyze_target_user_story, analysis_id, story_key)

    return f"Analysis is running with id '{analysis_id}'."


@tool
def get_analysis_status(analysis_id: str, runtime: ToolRuntime) -> str:
    """Get the status of a defect analysis.

    Args:
        analysis_id (str): The ID of the analysis to check.

    Returns:
        str: The current status of the analysis.
    """

    db = runtime.state.get("db_session")
    if not db:
        return "Database session not found in context. Cannot get analysis status."

    status = DefectDataService.get_analysis_status(db, analysis_id)

    if not status:
        return f"No analysis found with id '{analysis_id}'."

    return f"Analysis '{analysis_id}' status: {status}."


@tool
def show_analysis_status_bar_in_chat(analysis_id: str, runtime: ToolRuntime) -> str:
    """Show the analysis status bar in the chat interface.

    Args:
        analysis_id (str): The ID of the analysis to show status for.
    Returns:
        str: A message indicating the status bar has been shown.
    """
    pass


@tool
def modify_multiple_stories(modifications: list[dict], runtime: ToolRuntime) -> str:
    """Modify multiple user stories based on the provided modifications.
    Args:
        modifications (list[dict]): A list of modifications to apply to user stories.
            Each modification should include 'story_id', 'title' and/or 'description'.
            If 'title' or 'description' is not provided, that field will not be modified.
            At least one of 'title' or 'description' must be provided for each modification.
            Use normal text for title and markdown for description. For example:
            [
                {"story_key": "US-123", "title": "New Title", "description": "Updated description in **markdown**."},
                {"story_key": "US-456", "description": "**Another** updated description."}
            ]

    Returns:
        str: A summary of the modifications applied.
    """

    db = runtime.state.get("db_session")
    if not db:
        return "Database session not found in context. Cannot modify stories."

    project_key = runtime.state.get("project_key")
    if not project_key:
        return "Project key not found in context. Cannot modify stories."

    num_modified = DefectDataService.modify_multiple_stories(
        db, project_key, modifications
    )
    return f"Modifications applied to {num_modified} stories."


@tool
def modify_story(
    story_key: str,
    title: Optional[str],
    description: Optional[str],
    runtime: ToolRuntime,
) -> str:
    """Modify a user story's title and/or description.

    Args:
        story_key (str): The key of the user story to modify.
        title (Optional[str]): The new title for the user story. If None, the title will not be modified.
        description (Optional[str]): The new description for the user story. If None, the description will not be modified.

    Returns:
        str: A confirmation message indicating the modification status.
    """

    db = runtime.state.get("db_session")
    if not db:
        return "Database session not found in context. Cannot modify story."

    project_key = runtime.state.get("project_key")
    if not project_key:
        return "Project key not found in context. Cannot modify story."

    DefectDataService.modify_multiple_stories(
        db,
        project_key,
        [{"story_key": story_key, "title": title, "description": description}],
    )

    return f"Story '{story_key}' modified successfully."


@tool
def create_stories(
    stories: list[dict],
    runtime: ToolRuntime,
) -> str:
    """Create multiple user stories based on the provided stories.
    Args:
        stories (list[dict]): A list of stories to create.
            Each story should include 'summary' and 'description'.
            Use normal text for summary and markdown for description. For example:
            [
                {"summary": "New Story 1", "description": "Description in **markdown**."},
                {"summary": "New Story 2", "description": "**Another** description."}
            ]
    Returns:
        str: A confirmation message indicating the keys of the created stories.
    """

    project_key = runtime.state.get("project_key")
    if not project_key:
        return "Project key not found in context. Cannot create stories."

    keys = DefectDataService.create_stories(project_key, stories)
    return f"Stories created successfully with keys: {', '.join(keys)}."


tools = [
    get_defects,
    run_defect_analysis,
    get_analysis_status,
    show_analysis_status_bar_in_chat,
    modify_multiple_stories,
    modify_story,
    create_stories,
]
