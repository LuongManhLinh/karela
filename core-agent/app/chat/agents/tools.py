from langchain.tools import tool, ToolRuntime
from typing import Optional
import json

from app.proposal.services import ProposalService, ProposalRunService
from app.proposal.schemas import CreateProposalRequest, ProposeStoryRequest
from app.analysis.services import AnalysisDataService, DefectService
from app.integrations.jira.services import JiraService
from app.analysis.tasks import analyze_target_user_story

from llm.dynamic_agent import GenimiDynamicAgent
from common.configs import GeminiConfig
from langchain.messages import HumanMessage
from pydantic import BaseModel


class FilteredStoriesResponse(BaseModel):
    stories: list[dict]


# A lightweight model for keywords filtering, a temp placeholder for vector DB or embedding model
keyword_filter_agent = GenimiDynamicAgent(
    system_prompt="""You are a **Keyword Filter** specialized in filtering user stories based on keywords.

## Responsibilities
1. Given a list of user stories and a set of keywords, filter out the stories that are not relevant to the keywords.

## Output Format
- Return a JSON array of relevant user stories, including their key, summary, and description.
""",
    model_name="gemini-2.0-flash-lite",
    temperature=0,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
    response_mime_type="application/json",
    response_schema=FilteredStoriesResponse,
)


@tool
def search_stories_by_keywords(keywords: str, runtime: ToolRuntime) -> str:
    """Retrieve user stories based on keywords.

    Args:
        keywords (str): Keywords to search for user stories. For example: "authentication", "payment gateway", "user profile".

    Returns:
        str: A JSON string containing: the list of matching user stories or an error message.
    """
    print(
        f"""
{"-"*100}
| Retrieve Stories Tool Called
{"-"*100}
"""
    )

    db_session = runtime.context.db_session
    connection_id = runtime.context.connection_id
    project_key = runtime.context.project_key
    for item, item_name in [
        (db_session, "DB Session"),
        (connection_id, "Connection ID"),
        (project_key, "Project key"),
    ]:
        if not item:
            return json.dumps(
                {"error": f"{item_name} not found. Cannot retrieve stories."},
                indent=2,
            )
    story_service = JiraService(db_session)

    stories = story_service.fetch_stories(
        connection_id=connection_id, project_key=project_key
    )

    stories_to_filter = json.dumps(
        {"stories": [story.model_dump() for story in stories]}, indent=2
    )
    resp = keyword_filter_agent.invoke(
        messages=[
            HumanMessage(
                content="Stories to filter:\n"
                + stories_to_filter
                + "\n\nKeywords: "
                + keywords
            )
        ],
        stream_mode="values",
    )["structured_response"]
    return resp.model_dump_json(indent=2)


@tool
def get_story_details(story_key: str, runtime: ToolRuntime) -> str:
    """Fetch details of a User Story by its key.

    Args:
        story_key (str): The key of the User Story to fetch details for.

    Returns:
        str: A JSON string containing: the story details or an error message.
    """
    print(
        f"""
{"-"*100}
| Get Story Details Tool Called
{"-"*100}
"""
    )

    db_session = runtime.context.db_session
    connection_id = runtime.context.connection_id
    project_key = runtime.context.project_key
    for item, item_name in [
        (db_session, "DB Session"),
        (connection_id, "Connection ID"),
        (project_key, "Project key"),
    ]:
        if not item:
            return json.dumps(
                {"error": f"{item_name} not found. Cannot retrieve stories."},
                indent=2,
            )
    story_service = JiraService(db_session)

    fetched_stories = story_service.fetch_stories(
        connection_id=connection_id,
        project_key=project_key,
        story_keys=[story_key],
    )

    if len(fetched_stories) > 0:
        story_details = fetched_stories[0]
    else:
        return json.dumps(
            {"error": f"Story with key {story_key} not found."},
            indent=2,
        )

    return json.dumps({"story_details": story_details.model_dump()}, indent=2)


@tool
def get_defects_for_story(story_key: Optional[str], runtime: ToolRuntime) -> str:
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

    connection_id = runtime.context.connection_id
    project_key = runtime.context.project_key
    db_session = runtime.context.db_session
    for item, item_name in [
        (story_key, "Story Key"),
        (connection_id, "Connection ID"),
        (project_key, "Project key"),
        (db_session, "DB Session"),
    ]:
        if not item:
            return json.dumps(
                {"error": f"{item_name} not found. Cannot retrieve defects."},
                indent=2,
            )
    service = DefectService(db_session)
    defects = service.get_defects_by_story_key(connection_id, project_key, story_key)

    return json.dumps(
        {"defects": [defect.model_dump() for defect in defects]}, indent=2
    )


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

    connection_id = runtime.context.connection_id
    project_key = runtime.context.project_key
    db_session = runtime.context.db_session
    for item, item_name in [
        (story_key, "Story Key"),
        (connection_id, "Connection ID"),
        (project_key, "Project key"),
        (db_session, "DB Session"),
    ]:
        if not item:
            return json.dumps(
                {"error": f"{item_name} not found. Cannot run defect analysis."},
                indent=2,
            )
    analysis_data_service = AnalysisDataService(db_session)

    analysis_id, _ = analysis_data_service.init_analysis(
        connection_id=connection_id,
        project_key=project_key,
        analysis_type="TARGETED",
        story_key=story_key,
    )

    analyze_target_user_story(analysis_id)

    return json.dumps({"analysis_id": analysis_id, "status": "PENDING"}, indent=2)


@tool
def run_proposal_generation(
    defect_keys: list[str], clarifying_info: str, runtime: ToolRuntime
) -> str:
    """Run proposal generation based on detected defects.

    Args:
        defect_keys (list[str]): A list of defect keys to generate proposals for.
        clarifying_info (str): Additional clarifying information to consider during proposal generation, including question-answer exchanges.

    Returns:
        str: A JSON string containing: the proposal ID and status, or an error message.
    """
    print(
        f"""
{"-"*100}
| Run Proposal Generation Tool Called
| Defect Keys: {defect_keys}
| Clarifying Info: {clarifying_info}
{"-"*100}
"""
    )

    db_session = runtime.context.db_session
    connection_id = runtime.context.connection_id
    session_id = runtime.context.session_id
    project_key = runtime.context.project_key

    for item, item_name in [
        (db_session, "DB Session"),
        (connection_id, "Connection ID"),
        (session_id, "Session ID"),
        (project_key, "Project key"),
    ]:
        if not item:
            return json.dumps(
                {"error": f"{item_name} not found. Cannot run proposal generation."},
                indent=2,
            )

    defect_service = DefectService(db_session)
    proposal_run_service = ProposalRunService(db_session)

    defects = defect_service.get_defects_by_keys(defect_keys)
    proposal_keys = proposal_run_service.generate_proposals(
        session_id=session_id,
        source="CHAT",
        connection_id=connection_id,
        project_key=project_key,
        input_defects=defects,
        clarifications=clarifying_info,
    )

    return json.dumps(
        {"proposal_keys": proposal_keys, "status": "PROPOSALS_GENERATED"}, indent=2
    )


@tool
def update_stories(modifications: list[dict], runtime: ToolRuntime) -> str:
    """Modify one or many user stories.
    Story key is required for each modification.
    This will either be accepted or rejected by the user later.
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

    connection_id = runtime.context.connection_id
    project_key = runtime.context.project_key
    session_id = runtime.context.session_id
    db_session = runtime.context.db_session
    for item, item_name in [
        (db_session, "DB Session"),
        (connection_id, "Connection ID"),
        (session_id, "Session ID"),
        (project_key, "Project key"),
    ]:
        if not item:
            return json.dumps(
                {"error": f"{item_name} not found. Cannot update stories."},
                indent=2,
            )
    proposal_service = ProposalService(db_session)

    proposal_key = proposal_service.create_proposal(
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
            "proposal_keys": [proposal_key],
            "status": "Proposal to update stories created successfully.",
        },
        indent=2,
    )


@tool
def create_stories(
    stories: list[dict],
    runtime: ToolRuntime,
) -> str:
    """Create one or many user stories.
    Story key is NOT required for each creation since it will be automatically generated latter.
    This will either be accepted or rejected by the user later.

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
    connection_id = runtime.context.connection_id
    project_key = runtime.context.project_key
    session_id = runtime.context.session_id
    db_session = runtime.context.db_session
    for item, item_name in [
        (db_session, "DB Session"),
        (connection_id, "Connection ID"),
        (session_id, "Session ID"),
        (project_key, "Project key"),
    ]:
        if not item:
            return json.dumps(
                {"error": f"{item_name} not found. Cannot create stories."},
                indent=2,
            )
    proposal_service = ProposalService(db_session)

    proposal_key = proposal_service.create_proposal(
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
            "proposal_keys": [proposal_key],
            "status": "Proposal to create stories created successfully.",
        },
        indent=2,
    )


tools = [
    search_stories_by_keywords,
    get_story_details,
    get_defects_for_story,
    run_defect_analysis,
    run_proposal_generation,
    update_stories,
    create_stories,
]
