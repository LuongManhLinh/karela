from langchain.tools import tool, ToolRuntime
from typing import Optional
import json

from features.defect.services import DefectDataService
from features.defect.services import DefectRunService
from ..services import ChatDataService
from common.database import SessionLocal, uuid_generator

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
        str: A JSON string containing: the list of defects or an error message.
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
            return json.dumps(
                {
                    "error": "No story_key provided or found in context. Cannot fetch defects."
                },
                indent=2,
            )

    db = runtime.context.db_session
    if not db:
        return json.dumps(
            {"error": "Database session not found in context. Cannot fetch defects."},
            indent=2,
        )
    defects = DefectDataService.get_defects_by_work_item_key(db, story_key)

    return json.dumps({"defects": defects}, indent=2)


@tool
def run_defect_analysis(story_key: Optional[str], runtime: ToolRuntime) -> str:
    """Run a defect analysis for a User Story.

    Args:
        story_key (Optional[str]): The key of the Story to run defect analysis for. If None, use story_key from current context.

    Returns:
        str: A JSON string containing: the analysis ID and status, or an error message.
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
        return json.dumps(
            {
                "error": "Database session not found in context. Cannot run defect analysis."
            },
            indent=2,
        )
    project_key = runtime.context.project_key
    if not project_key:
        print("Project key not found in context.")
        return json.dumps(
            {"error": "Project key not found in context. Cannot run defect analysis."},
            indent=2,
        )

    if not story_key:
        story_key = runtime.context.story_key
    if not story_key:
        return json.dumps(
            {
                "error": "No story_key provided or found in context. Cannot run defect analysis."
            },
            indent=2,
        )

    db = runtime.context.db_session
    if not db:
        return json.dumps(
            {
                "error": "Database session not found in context. Cannot run defect analysis."
            },
            indent=2,
        )

    project_key = runtime.context.project_key
    if not project_key:
        return json.dumps(
            {"error": "Project key not found in context. Cannot run defect analysis."},
            indent=2,
        )

    connection_id = runtime.context.connection_id
    if not connection_id:
        return json.dumps(
            {
                "error": "Connection ID not found in context. Cannot run defect analysis."
            },
            indent=2,
        )

    analysis_id = DefectDataService.init_analysis(
        db,
        connection_id=connection_id,
        project_key=project_key,
        analysis_type="TARGETED",
    )

    task_queue.enqueue(analyze_target_user_story, analysis_id, story_key)

    return json.dumps({"analysis_id": analysis_id, "status": "PENDING"}, indent=2)


@tool
def get_analysis_status(analysis_id: str, runtime: ToolRuntime) -> str:
    """Get the status of a defect analysis.

    Args:
        analysis_id (str): The ID of the analysis to check.

    Returns:
        str: A JSON string containing: the analysis ID and its current status or an error message.
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
        return json.dumps(
            {
                "error": "Database session not found in context. Cannot get analysis status."
            },
            indent=2,
        )

    status = DefectDataService.get_analysis_status(db, analysis_id)

    if not status:
        return json.dumps(
            {"error": f"Analysis with ID {analysis_id} not found."}, indent=2
        )

    return json.dumps({"analysis_id": analysis_id, "status": status}, indent=2)


@tool
def show_analysis_progress_in_chat(analysis_id: str, runtime: ToolRuntime) -> str:
    """Show the analysis progress in the chat interface.

    Args:
        analysis_id (str): The ID of the analysis to show status for.
    Returns:
        str: A JSON string indicating success or failure of posting the progress message.
    """
    print(
        f"""
{"-"*100}
| Show Analysis Progress in Chat Tool Called
{"-"*100}
"""
    )

    session_id = runtime.context.session_id
    if not session_id:
        return json.dumps(
            {
                "error": "Session ID not found in context. Cannot show analysis progress."
            },
            indent=2,
        )

    return json.dumps(
        {
            "analysis_id": analysis_id,
            "status": "Posted in the chat session successfully.",
        },
        indent=2,
    )


@tool
def get_latest_done_analysis(story_key: Optional[str], runtime: ToolRuntime) -> str:
    """Get the latest done analysis information, including start time, end time and a list of detected defects.
    Args:
        story_key (Optional[str]): If specified, fetch the latest done analysis for the Story having this key.
            If None, fetch the latest done analysis for the current project in context.

    Returns:
        str: A JSON string containing: the latest done analysis information or an error message.
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
        return json.dumps(
            {
                "error": "Database session not found in context. Cannot get latest done analysis."
            },
            indent=2,
        )

    project_key = runtime.context.project_key
    if not project_key:
        return json.dumps(
            {
                "error": "Project key not found in context. Cannot get latest done analysis."
            },
            indent=2,
        )

    analysis = DefectDataService.get_latest_done_analysis(db, project_key, story_key)
    if analysis:
        return json.dumps(analysis, indent=2)
    return json.dumps(
        {"error": "No analysis found for the given parameters."},
        indent=2,
    )


@tool
def propose_modifying_stories(modifications: list[dict], runtime: ToolRuntime) -> str:
    """Make proposals to modify one or many user stories. The proposals will either be accepted or rejected by the user later.
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
        str: A JSON string containing: the list of proposed story keys or an error message.
    """

    print(
        f"""
{"-"*100}
| Modify Story Proposals Tool Called
{"-"*100}
"""
    )

    db = runtime.context.db_session
    if not db:
        return json.dumps(
            {"error": "Database session not found in context. Cannot modify stories."},
            indent=2,
        )

    session_id = runtime.context.session_id
    if not session_id:
        return json.dumps(
            {"error": "Session ID not found in context. Cannot modify stories."},
            indent=2,
        )

    project_key = runtime.context.project_key
    if not project_key:
        return json.dumps(
            {"error": "Project key not found in context. Cannot modify stories."},
            indent=2,
        )

    propose_id, modified_keys = ChatDataService.propose_modifying_stories(
        db, session_id, project_key, modifications
    )
    return json.dumps(
        {"proposed_story_keys": modified_keys, "propose_id": propose_id}, indent=2
    )


@tool
def propose_creating_stories(
    stories: list[dict],
    runtime: ToolRuntime,
) -> str:
    """Make proposals to create one or many user stories. The proposals will either be accepted or rejected by the user later.

    Args:
        stories (list[dict]): A list of user stories to create.
            Each story must include both 'summary' and 'description'.
            'summary' should be normal text, and 'description' should be in markdown format.
            For example:
            [
                {"summary": "New Story 1", "description": "Description for **Story 1**."},
                {"summary": "New Story 2", "description": "Description for **Story 2**."}
            ]

    Returns:
        str: A message indicating the success of the story creation.
    """

    print(
        f"""
{"-"*100}
| Create Story Proposals Tool Called
{"-"*100}
"""
    )

    db = runtime.context.db_session
    if not db:
        return "Database session not found in context. Cannot create stories."

    session_id = runtime.context.session_id
    if not session_id:
        return "Session ID not found in context. Cannot create stories."

    project_key = runtime.context.project_key
    if not project_key:
        return "Project key not found in context. Cannot create stories."

    propose_id, keys = ChatDataService.propose_creating_stories(
        db, session_id, project_key, stories
    )
    return json.dumps({"proposed_story_keys": keys, "propose_id": propose_id}, indent=2)


tools = [
    get_defects,
    run_defect_analysis,
    get_analysis_status,
    get_latest_done_analysis,
    show_analysis_progress_in_chat,
    propose_modifying_stories,
    propose_creating_stories,
]
