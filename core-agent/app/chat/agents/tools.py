from langchain.tools import tool, ToolRuntime
from typing import Optional
import json

from app.proposal.services import ProposalService
from app.proposal.schemas import CreateProposalRequest, ProposeStoryRequest
from app.analysis.services import AnalysisDataService, DefectService
from app.analysis.tasks import analyze_target_user_story

from common.redis_app import task_queue


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

    service: DefectService = runtime.context.defect_service
    if not service:
        return json.dumps(
            {
                "error": "AnalysisDataService not found in context. Cannot fetch defects."
            },
            indent=2,
        )
    defects = service.get_defects_by_story_key(story_key)

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
    if not story_key:
        story_key = runtime.context.story_key
    if not story_key:
        return json.dumps(
            {
                "error": "No story_key provided or found in context. Cannot run defect analysis."
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

    analysis_data_service: AnalysisDataService = runtime.context.analysis_data_service
    if not analysis_data_service:
        return json.dumps(
            {
                "error": "AnalysisDataService not found in context. Cannot run defect analysis."
            },
            indent=2,
        )

    analysis_id = analysis_data_service.init_analysis(
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

    analysis_data_service: AnalysisDataService = runtime.context.analysis_data_service
    if not analysis_data_service:
        return json.dumps(
            {
                "error": "AnalysisDataService not found in context. Cannot get analysis status."
            },
            indent=2,
        )

    status = analysis_data_service.get_analysis_status(analysis_id)

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

    analysis_data_service: AnalysisDataService = runtime.context.analysis_data_service
    if not analysis_data_service:
        return json.dumps(
            {
                "error": "AnalysisDataService not found in context. Cannot get latest done analysis."
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

    analysis = analysis_data_service.get_latest_done_analysis(project_key, story_key)
    if analysis:
        return json.dumps(analysis, indent=2)
    return json.dumps(
        {"error": "No analysis found for the given parameters."},
        indent=2,
    )


@tool
def propose_updating_stories(modifications: list[dict], runtime: ToolRuntime) -> str:
    """Make proposals to modify one or many user stories.
    Story key is required for each modification.
    The proposals will either be accepted or rejected by the user later.
    Args:
        modifications (list[dict]): A list of modifications to apply to user stories.
            Each modification should include 'story_id', `summary` and/or `description`,
            and may include `explanation`.
            If `summary` or `description` is not provided, that field will not be modified.
            At least one of `summary` or `description` must be provided for each modification.
            Use normal text for summary and markdown for description. For example:
            [
                {
                    "story_key": "US-123",
                    "summary": "New Summary",
                    "description": "Updated description in **markdown**.",
                    "explanation": "This change is necessary because..."
                },
                {
                    "story_key": "US-456",
                    "description": "**Another** updated description.",
                    "explanation": "This change is necessary to address the issue."
                }
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

    proposal_service: ProposalService = runtime.context.proposal_service
    if not proposal_service:
        return json.dumps(
            {"error": "ProposalService not found in context. Cannot modify stories."},
            indent=2,
        )

    connection_id = runtime.context.connection_id
    if not connection_id:
        return json.dumps(
            {"error": "Connection ID not found in context. Cannot modify stories."},
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

    proposal_id = proposal_service.create_proposal(
        proposal_request=CreateProposalRequest(
            source="CHAT",
            connection_id=connection_id,
            session_id=session_id,
            project_key=project_key,
            stories=[
                ProposeStoryRequest(
                    type="UPDATE",
                    key=modification["story_key"],
                    summary=modification.get("summary"),
                    description=modification.get("description"),
                    explanation=modification.get("explanation"),
                )
                for modification in modifications
            ],
        )
    )
    return json.dumps(
        {
            "proposal_id": proposal_id,
            "status": "Proposal to update stories created successfully.",
        },
        indent=2,
    )


@tool
def propose_creating_stories(
    stories: list[dict],
    runtime: ToolRuntime,
) -> str:
    """Make proposals to create one or many user stories.
    Story key is NOT required for each creation since it will be automatically generated latter.
    The proposals will either be accepted or rejected by the user later.

    Args:
        stories (list[dict]): A list of user stories to create.
            Each story must include both `summary` and `description`, and may include `explanation`.
            `summary` should be normal text, and `description` should be in markdown format.
            For example:
            [
                {
                    "summary": "New Summary",
                    "description": "Updated description in **markdown**.",
                    "explanation": "This change is necessary because..."
                },
                {
                    "summary": "Another New Summary",
                    "description": "**Another** updated description.",
                    "explanation": "This change is necessary to address the issue."
                }
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

    proposal_service: ProposalService = runtime.context.proposal_service
    if not proposal_service:
        return json.dumps(
            {"error": "ProposalService not found in context. Cannot create stories."},
            indent=2,
        )

    connection_id = runtime.context.connection_id
    if not connection_id:
        return json.dumps(
            {"error": "Connection ID not found in context. Cannot create stories."},
            indent=2,
        )

    session_id = runtime.context.session_id
    if not session_id:
        return json.dumps(
            {"error": "Session ID not found in context. Cannot create stories."},
            indent=2,
        )

    project_key = runtime.context.project_key
    if not project_key:
        return json.dumps(
            {"error": "Project key not found in context. Cannot create stories."},
            indent=2,
        )

    proposal_id = proposal_service.create_proposal(
        proposal_request=CreateProposalRequest(
            source="CHAT",
            connection_id=connection_id,
            session_id=session_id,
            project_key=project_key,
            stories=[
                ProposeStoryRequest(
                    type="CREATE",
                    summary=story.get("summary"),
                    description=story.get("description"),
                    explanation=story.get("explanation"),
                )
                for story in stories
            ],
        )
    )
    return json.dumps(
        {
            "proposal_id": proposal_id,
            "status": "Proposal to create stories created successfully.",
        },
        indent=2,
    )


def propose_multiple_types_of_story_changes(
    modifications: list[dict],
    creations: list[dict],
    runtime: ToolRuntime,
) -> str:
    """Make proposals to modify existing user stories and create new ones.
    The proposals will either be accepted or rejected by the user later.

    Args:
        modifications (list[dict]): A list of modifications to apply to existing user stories.
            Each modification should include 'story_key', `summary` and/or `description`,
            and may include 'explanation'.
            At least one of `summary` or `description` must be provided for each modification.
            Use normal text for summary and markdown for description. For example:
            [
                {
                    "story_key": "US-123",
                    "summary": "New Summary",
                    "description": "Updated description in **markdown**.",
                    "explanation": "This change is necessary because..."
                },
                {
                    "story_key": "US-456",
                    "description": "**Another** updated description.",
                    "explanation": "This change is necessary to address the issue."
                }
            ]

        creations (list[dict]): A list of new user stories to create.
            Each story must include both `summary` and `description`, and may include 'explanation'.
            `summary` should be normal text, and `description` should be in markdown format.
            For example:
            [
                {
                    "summary": "New Summary",
                    "description": "Description in **markdown**.",
                    "explanation": "This story is needed because..."
                },
                {
                    "summary": "Another New Summary",
                    "description": "**Another** description.",
                    "explanation": "This story is important to address the issue."
                }
            ]
    Returns:
        str: A JSON string containing: the proposal ID or an error message.
    """

    print(
        f"""
{"-"*100}
| Propose Multiple Types of Story Changes Tool Called
{"-"*100}
"""
    )

    proposal_service: ProposalService = runtime.context.proposal_service
    if not proposal_service:
        return json.dumps(
            {
                "error": "ProposalService not found in context. Cannot propose story changes."
            },
            indent=2,
        )

    connection_id = runtime.context.connection_id
    if not connection_id:
        return json.dumps(
            {
                "error": "Connection ID not found in context. Cannot propose story changes."
            },
            indent=2,
        )

    session_id = runtime.context.session_id
    if not session_id:
        return json.dumps(
            {"error": "Session ID not found in context. Cannot propose story changes."},
            indent=2,
        )

    project_key = runtime.context.project_key
    if not project_key:
        return json.dumps(
            {
                "error": "Project key not found in context. Cannot propose story changes."
            },
            indent=2,
        )

    update_stories = [
        ProposeStoryRequest(
            type="UPDATE",
            key=modification["story_key"],
            summary=modification.get("summary"),
            description=modification.get("description"),
        )
        for modification in modifications
    ]

    create_stories = [
        ProposeStoryRequest(
            type="CREATE",
            summary=story.get("summary"),
            description=story.get("description"),
        )
        for story in creations
    ]

    proposal_id = proposal_service.create_proposal(
        proposal_request=CreateProposalRequest(
            source="CHAT",
            connection_id=connection_id,
            session_id=session_id,
            project_key=project_key,
            stories=update_stories + create_stories,
        )
    )
    return json.dumps(
        {
            "proposal_id": proposal_id,
            "status": "Proposal to modify and create stories created successfully.",
        },
        indent=2,
    )


tools = [
    get_defects,
    run_defect_analysis,
    get_analysis_status,
    get_latest_done_analysis,
    show_analysis_progress_in_chat,
    propose_updating_stories,
    propose_creating_stories,
    propose_multiple_types_of_story_changes,
]
