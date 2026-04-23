from langchain.tools import tool, ToolRuntime
from typing import Optional
import json

from app.proposal.services import ProposalService, ProposalRunService
from app.proposal.schemas import CreateProposalRequest, ProposeStoryRequest
from app.analysis.services import AnalysisDataService, DefectService
from app.connection.jira.services import JiraService
from app.connection.jira.vectorstore import JiraVectorStore
from app.analysis.tasks import run_analysis
from .context import Context
from app.documentation.llm_tools import doc_tools
from app.xgraphrag.search.llm_tools import graphrag_search_tools


@tool
def get_story_details(story_key: str, runtime: ToolRuntime[Context]) -> str:
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

    context = runtime.context
    story_service = JiraService(db=context.db)

    fetched_stories = story_service.fetch_stories(
        connection_id=context.connection_id,
        project_key=context.project_key,
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
def get_defects_for_story(story_key: str, runtime: ToolRuntime[Context]) -> str:
    """Fetch defects for a User Story by its key.

    Args:
        story_key (str):
            The key of the User Story to fetch defects for.

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
        return json.dumps(
            {"error": "Story Key not provided. Cannot retrieve defects."},
            indent=2,
        )
    context = runtime.context
    service = DefectService(db=context.db)
    defects = service.get_defects_by_story_key(
        connection_id=context.connection_id,
        project_key=context.project_key,
        story_key=story_key,
    )

    return json.dumps(
        {"defects": [defect.model_dump() for defect in defects]}, indent=2
    )


@tool
def run_defect_analysis(story_key: Optional[str], runtime: ToolRuntime[Context]) -> str:
    """Run a defect analysis for a User Story.

    Args:
        story_key (str): The key of the Story to run defect analysis for.

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
        return json.dumps(
            {"error": "Story Key not provided. Cannot run defect analysis."},
            indent=2,
        )
    context = runtime.context
    analysis_data_service = AnalysisDataService(db=context.db)

    analysis_id, _ = analysis_data_service.init_analysis(
        connection_id=context.connection_id,
        project_key=context.project_key,
        analysis_type="TARGETED",
        story_key=story_key,
    )

    run_analysis(analysis_id=analysis_id)

    return json.dumps({"analysis_id": analysis_id, "status": "PENDING"}, indent=2)


@tool
def run_proposal_generation(
    defect_keys: list[str], clarifying_info: str, runtime: ToolRuntime[Context]
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

    if not defect_keys:
        return json.dumps(
            {"error": "Defect keys not provided. Cannot run proposal generation."},
            indent=2,
        )

    context = runtime.context

    defect_service = DefectService(db=context.db)
    proposal_run_service = ProposalRunService(db=context.db)

    defects = defect_service.get_defects_by_keys(defect_keys)
    proposal_keys = proposal_run_service.generate_proposals(
        session_id=context.session_id,
        source="CHAT",
        connection_id=context.connection_id,
        project_key=context.project_key,
        input_defects=defects,
        clarifications=clarifying_info,
    )

    return json.dumps(
        {"proposal_keys": proposal_keys, "status": "PROPOSALS_GENERATED"}, indent=2
    )


@tool
def update_stories(modifications: list[dict], runtime: ToolRuntime[Context]) -> str:
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

    if not modifications:
        return json.dumps(
            {"error": "No modifications provided. Cannot update stories."},
            indent=2,
        )
    context = runtime.context
    proposal_service = ProposalService(db=context.db)

    proposal_key = proposal_service.create_proposal(
        proposal_request=CreateProposalRequest(
            source="CHAT",
            connection_id=context.connection_id,
            session_id=context.session_id,
            project_key=context.project_key,
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
    runtime: ToolRuntime[Context],
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
    if not stories:
        return json.dumps(
            {"error": "No story data provided. Cannot create stories."},
            indent=2,
        )
    context = runtime.context
    proposal_service = ProposalService(db=context.db)

    proposal_key = proposal_service.create_proposal(
        proposal_request=CreateProposalRequest(
            source="CHAT",
            connection_id=context.connection_id,
            session_id=context.session_id,
            project_key=context.project_key,
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
    get_story_details,
    get_defects_for_story,
    run_defect_analysis,
    run_proposal_generation,
    update_stories,
    create_stories,
]

tools.extend(doc_tools)
tools.extend(graphrag_search_tools)
