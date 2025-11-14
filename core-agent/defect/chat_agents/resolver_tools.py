from langchain.tools import tool, ToolRuntime
from typing import Optional
import json

from ..services.data_service import DefectDataService
from ..services.run_services import DefectRunService
from database import SessionLocal

from common.redis_app import task_queue


def analyze_target_user_story(analysis_id: str, target_story_key: str):
    db = SessionLocal()
    try:
        DefectRunService.analyze_target_user_story(db, analysis_id, target_story_key)
    finally:
        db.close()


@tool
def get_defects(story_key: Optional[str], runtime: ToolRuntime) -> str:
    """Fetch defects for a User Story by its key.

    Args:
        story_key (Optional[str]):
            The key of the User Story to fetch defects for.
            If None, use story_key from current context.

    Returns:
        str: A summary of defects associated with the Story.
    """
    print(
        f"""
{"-"*100}
| Get Defects Tool Called
{"-"*100}
"""
    )

    if not story_key:
        story_key = runtime.context.story_key

        if not story_key:
            return "No story_key provided or found in context. Cannot fetch defects."

    db = runtime.context.db_session
    if not db:
        return "Database session not found in context. Cannot fetch defects."
    defects = DefectDataService.get_defects_by_work_item(db, story_key)

    if not defects:
        return "No defects found for the provided story_key."

    return f"Defects found:\n{json.dumps(defects, indent=2)}"


@tool
def run_defect_analysis(story_key: Optional[str], runtime: ToolRuntime) -> str:
    """Run a defect analysis for a User Story.

    Args:
        story_key (Optional[str]): The key of the Story to run defect analysis for. If None, use story_key from current context.

    Returns:
        str: The result of the defect analysis.
    """
    print(
        f"""
{"-"*100}
| Run Defect Analysis Tool Called
| Story Key: {story_key}
{"-"*100}
"""
    )

    db = runtime.context.db_session
    if not db:
        print("Database session not found in context.")
        return "Database session not found in context. Cannot run defect analysis."
    project_key = runtime.context.project_key
    if not project_key:
        print("Project key not found in context.")
        return "Project key not found in context. Cannot run defect analysis."

    if not story_key:
        story_key = runtime.context.story_key
    if not story_key:
        return "No story_key provided or found in context. Cannot run defect analysis."

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
    print(
        f"""
{"-"*100}
| Get Analysis Status Tool Called
{"-"*100}
"""
    )

    db = runtime.context.db_session
    if not db:
        return "Database session not found in context. Cannot get analysis status."

    status = DefectDataService.get_analysis_status(db, analysis_id)

    if not status:
        return f"No analysis found with id '{analysis_id}'."

    return f"Analysis '{analysis_id}' status: {status}."


@tool
def show_analysis_progress_in_chat(analysis_id: str, runtime: ToolRuntime) -> str:
    """Show the analysis progress in the chat interface.

    Args:
        analysis_id (str): The ID of the analysis to show status for.
    Returns:
        str: A message indicating the progress has been shown.
    """
    print(
        f"""
{"-"*100}
| Show Analysis Progress in Chat Tool Called
{"-"*100}
"""
    )

    db = runtime.context.db_session
    if not db:
        return "Database session not found in context. Cannot show analysis progress."

    session_id = runtime.context.session_id
    if not session_id:
        return "Session ID not found in context. Cannot show analysis progress."

    DefectDataService.create_analysis_progress_message(db, session_id, analysis_id)
    return f"Analysis progress for '{analysis_id}' has been posted in the chat."


@tool
def get_latest_done_analysis(
    story_key: Optional[str], runtime: ToolRuntime
) -> Optional[str]:
    """Get the latest done analysis information, including start time, end time and a list of detected defects.
    Args:
        story_key (Optional[str]): If specified, fetch the latest done analysis for the Story having this key.
            If None, fetch the latest done analysis for the current project in context.

    Returns:
        Optional[str]: The latest done analysis information as a JSON string, or None if no analysis is found.
    """

    print(
        f"""
{"-"*100}
| Get Latest Done Analysis Tool Called
{"-"*100}
"""
    )

    db = runtime.context.db_session
    if not db:
        return None

    project_key = runtime.context.project_key
    if not project_key:
        return None

    analysis = DefectDataService.get_latest_done_analysis(db, project_key, story_key)
    if analysis:
        return json.dumps(analysis, indent=2)
    return None


@tool
def modify_multiple_stories(modifications: list[dict], runtime: ToolRuntime) -> str:
    """Modify multiple user stories based on the provided modifications.
    Args:
        modifications (list[dict]): A list of modifications to apply to user stories.
            Each modification should include 'story_id', 'summary' and/or 'description'.
            If 'summary' or 'description' is not provided, that field will not be modified.
            At least one of 'summary' or 'description' must be provided for each modification.
            Use normal text for summary and markdown for description. For example:
            [
                {"story_key": "US-123", "summary": "New Summary", "description": "Updated description in **markdown**."},
                {"story_key": "US-456", "description": "**Another** updated description."}
            ]

    Returns:
        str: A summary of the modifications applied.
    """

    print(
        f"""
{"-"*100}
| Modify Multiple Stories Tool Called
{"-"*100}
"""
    )

    db = runtime.context.db_session
    if not db:
        return "Database session not found in context. Cannot modify stories."

    project_key = runtime.context.project_key
    if not project_key:
        return "Project key not found in context. Cannot modify stories."

    modified_keys = DefectDataService.propose_modifying_stories(
        db, project_key, modifications
    )
    return f"Modifications applied to stories with keys: {', '.join(modified_keys)}."


@tool
def modify_story(
    story_key: str,
    summary: Optional[str],
    description: Optional[str],
    runtime: ToolRuntime,
) -> str:
    """Modify a user story's summary and/or description.

    Args:
        story_key (str): The key of the user story to modify.
        summary (Optional[str]): The new summary for the user story. If None, the summary will not be modified.
        description (Optional[str]): The new description for the user story. If None, the description will not be modified.

    Returns:
        str: A confirmation message indicating the modification status.
    """

    print(
        f"""
{"-"*100}
| Modify Story Tool Called
{"-"*100}
"""
    )

    db = runtime.context.db_session
    if not db:
        return "Database session not found in context. Cannot modify story."

    project_key = runtime.context.project_key
    if not project_key:
        return "Project key not found in context. Cannot modify story."

    modified_keys = DefectDataService.propose_modifying_stories(
        db,
        project_key,
        [{"story_key": story_key, "summary": summary, "description": description}],
    )

    if modified_keys:
        return f"Story '{story_key}' modified successfully."
    else:
        return f"No modifications applied to story '{story_key}'."


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

    print(
        f"""
{"-"*100}
| Create Stories Tool Called
{"-"*100}
"""
    )

    db = runtime.context.db_session
    if not db:
        return "Database session not found in context. Cannot create stories."

    project_key = runtime.context.project_key
    if not project_key:
        return "Project key not found in context. Cannot create stories."

    keys = DefectDataService.propose_creating_stories(db, project_key, stories)
    return f"Stories created successfully with keys: {', '.join(keys)}."


tools = [
    get_defects,
    run_defect_analysis,
    get_analysis_status,
    get_latest_done_analysis,
    show_analysis_progress_in_chat,
    modify_multiple_stories,
    modify_story,
    create_stories,
]
