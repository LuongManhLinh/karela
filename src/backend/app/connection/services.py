from sqlalchemy.orm import Session
from sqlalchemy import func, select, distinct, and_, case, literal

from .schemas import ConnectionDashboardDto, ProjectDashboardDto, StoryDashboardDto
from .jira.models import Connection, Project, Story, GherkinAC
from .jira.schemas import StorySummary, ProjectDto
from app.analysis.models import Analysis, Defect, DefectStoryKey
from app.chat.models import ChatSession
from app.proposal.models import Proposal, ProposalContent


def _to_story_summaries(stories: list[Story]) -> list[StorySummary]:
    return [StorySummary(id=s.id, key=s.key, summary=s.summary) for s in stories]


def _to_project_dtos(projects: list[Project]) -> list[ProjectDto]:
    return [
        ProjectDto(id=p.id, key=p.key, name=p.name, avatar_url=p.avatar_url)
        for p in projects
    ]


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_project_dashboard_info(
        self, user_id: str, connection_name: str, project_key: str
    ) -> ProjectDashboardDto:
        # Check project exists
        project = (
            self.db.query(Project)
            .join(Connection)
            .filter(
                Connection.user_id == user_id,
                Connection.name == connection_name,
                Project.key == project_key,
            )
            .first()
        )

        if not project:
            raise ValueError("Project not found")

        # --- Aggregate counts in a single query ---
        counts = (
            self.db.query(
                func.count(Story.id).label("num_stories"),
            )
            .filter(Story.project_id == project.id)
            .one()
        )
        num_stories = counts.num_stories

        connection_id = project.connection_id

        num_analyses, num_chats, num_proposals, num_ac = self.db.query(
            # analyses
            (
                select(func.count(Analysis.id))
                .where(
                    Analysis.connection_id == connection_id,
                    Analysis.project_key == project_key,
                )
                .correlate(None)
                .scalar_subquery()
            ),
            # chats
            (
                select(func.count(ChatSession.id))
                .where(
                    ChatSession.connection_id == connection_id,
                    ChatSession.project_key == project_key,
                )
                .correlate(None)
                .scalar_subquery()
            ),
            # proposals
            (
                select(func.count(Proposal.id))
                .where(
                    Proposal.connection_id == connection_id,
                    Proposal.project_key == project_key,
                )
                .correlate(None)
                .scalar_subquery()
            ),
            # acceptance criteria
            (
                select(func.count(GherkinAC.id))
                .join(Story)
                .where(Story.project_id == project.id)
                .correlate(None)
                .scalar_subquery()
            ),
        ).one()

        # --- Build reusable subqueries for story categorization ---

        # Story keys that have defects in this project's analyses
        defect_story_keys_subq = (
            select(distinct(DefectStoryKey.story_key))
            .join(Defect)
            .join(Analysis)
            .where(
                Analysis.connection_id == connection_id,
                Analysis.project_key == project_key,
            )
            .correlate(None)
            .subquery()
        )

        # Story keys that have proposals (via proposal_contents)
        proposal_story_keys_subq = (
            select(distinct(ProposalContent.story_key))
            .join(Proposal)
            .where(
                Proposal.connection_id == connection_id,
                Proposal.project_key == project_key,
                ProposalContent.story_key.isnot(None),
            )
            .correlate(None)
            .subquery()
        )

        # Story IDs that have acceptance criteria
        ac_story_ids_subq = (
            select(distinct(GherkinAC.story_id)).correlate(None).subquery()
        )

        # --- Fetch all project stories once, with boolean flags ---
        has_analysis = Story.key.in_(select(defect_story_keys_subq))
        has_proposal = Story.key.in_(select(proposal_story_keys_subq))
        has_ac = Story.id.in_(select(ac_story_ids_subq))
        has_defect = Story.key.in_(select(defect_story_keys_subq))

        stories_with_flags = (
            self.db.query(
                Story,
                case((has_analysis, literal(True)), else_=literal(False)).label(
                    "has_analysis"
                ),
                case((has_proposal, literal(True)), else_=literal(False)).label(
                    "has_proposal"
                ),
                case((has_ac, literal(True)), else_=literal(False)).label("has_ac"),
                case((has_defect, literal(True)), else_=literal(False)).label(
                    "has_defect"
                ),
            )
            .filter(Story.project_id == project.id)
            .all()
        )

        stories_with_analyses = []
        stories_with_proposals = []
        stories_with_ac = []
        ready_stories = []

        for (
            story,
            flag_analysis,
            flag_proposal,
            flag_ac,
            flag_defect,
        ) in stories_with_flags:
            if flag_analysis:
                stories_with_analyses.append(story)
            if flag_proposal:
                stories_with_proposals.append(story)
            if flag_ac:
                stories_with_ac.append(story)
                # Ready = has AC and no defects
                if not flag_defect:
                    ready_stories.append(story)

        readiness_score = (
            len(ready_stories) / num_stories * 100 if num_stories > 0 else 0.0
        )
        print(f"Readiness score: {readiness_score}")

        return ProjectDashboardDto(
            num_stories=num_stories,
            num_analyses=num_analyses,
            num_chats=num_chats,
            num_proposals=num_proposals,
            num_acs=num_ac,
            stories_with_analyses=_to_story_summaries(stories_with_analyses),
            stories_with_proposals=_to_story_summaries(stories_with_proposals),
            stories_with_acs=_to_story_summaries(stories_with_ac),
            ready_stories=_to_story_summaries(ready_stories),
            readiness_score=readiness_score,
        )

    def get_story_dashboard_info(
        self, user_id: str, connection_name: str, project_key: str, story_key: str
    ) -> StoryDashboardDto:
        # Verify the story exists and get connection_id
        result = (
            self.db.query(Story, Connection.id.label("connection_id"))
            .join(Story.project)
            .join(Project.connection)
            .filter(
                Connection.user_id == user_id,
                Connection.name == connection_name,
                Project.key == project_key,
                Story.key == story_key,
            )
            .first()
        )

        if not result:
            raise ValueError("Story not found")

        story, connection_id = result

        # All counts in a single round-trip
        num_analyses, num_proposals, num_ac = self.db.query(
            # analyses referencing this story via defect_story_keys
            (
                select(func.count(distinct(Analysis.id)))
                .join(Defect)
                .join(DefectStoryKey)
                .where(
                    Analysis.connection_id == connection_id,
                    Analysis.project_key == project_key,
                    DefectStoryKey.story_key == story_key,
                )
                .correlate(None)
                .scalar_subquery()
            ),
            # proposals with content for this story
            (
                select(func.count(distinct(Proposal.id)))
                .join(ProposalContent)
                .where(
                    Proposal.connection_id == connection_id,
                    Proposal.project_key == project_key,
                    ProposalContent.story_key == story_key,
                )
                .correlate(None)
                .scalar_subquery()
            ),
            # acceptance criteria
            (
                select(func.count(GherkinAC.id))
                .where(GherkinAC.story_id == story.id)
                .correlate(None)
                .scalar_subquery()
            ),
        ).one()

        return StoryDashboardDto(
            num_analyses=num_analyses,
            num_proposals=num_proposals,
            num_acs=num_ac,
        )

    def get_connection_dashboard_info(
        self, user_id: str, connection_name: str
    ) -> ConnectionDashboardDto:
        # Verify the connection exists
        connection = (
            self.db.query(Connection)
            .filter(
                Connection.user_id == user_id,
                Connection.name == connection_name,
            )
            .first()
        )

        if not connection:
            raise ValueError("Connection not found")

        # --- All counts in a single round-trip ---
        num_projects, num_analyses, num_chats, num_proposals, num_ac = self.db.query(
            (
                select(func.count(Project.id))
                .where(Project.connection_id == connection.id)
                .correlate(None)
                .scalar_subquery()
            ),
            (
                select(func.count(Analysis.id))
                .where(Analysis.connection_id == connection.id)
                .correlate(None)
                .scalar_subquery()
            ),
            (
                select(func.count(ChatSession.id))
                .where(ChatSession.connection_id == connection.id)
                .correlate(None)
                .scalar_subquery()
            ),
            (
                select(func.count(Proposal.id))
                .where(Proposal.connection_id == connection.id)
                .correlate(None)
                .scalar_subquery()
            ),
            (
                select(func.count(GherkinAC.id))
                .join(Story)
                .join(Project)
                .where(Project.connection_id == connection.id)
                .correlate(None)
                .scalar_subquery()
            ),
        ).one()

        # --- Build reusable subqueries for project categorization ---

        # Project IDs that have analyses (via defects -> defect_story_keys -> stories)
        analysis_project_ids_subq = (
            select(distinct(Project.id))
            .join(Story)
            .join(DefectStoryKey, Story.key == DefectStoryKey.story_key)
            .join(Defect)
            .join(Analysis)
            .where(Analysis.connection_id == connection.id)
            .correlate(None)
            .subquery()
        )

        # Project keys that have chat sessions
        chat_project_keys_subq = (
            select(distinct(ChatSession.project_key))
            .where(
                ChatSession.connection_id == connection.id,
                ChatSession.project_key.isnot(None),
            )
            .correlate(None)
            .subquery()
        )

        # Project keys that have proposals
        proposal_project_keys_subq = (
            select(distinct(Proposal.project_key))
            .where(
                Proposal.connection_id == connection.id,
                Proposal.project_key.isnot(None),
            )
            .correlate(None)
            .subquery()
        )

        # Project IDs that have acceptance criteria
        ac_project_ids_subq = (
            select(distinct(Project.id))
            .join(Story)
            .join(GherkinAC, Story.id == GherkinAC.story_id)
            .where(Project.connection_id == connection.id)
            .correlate(None)
            .subquery()
        )

        # --- Fetch all connection projects once, with boolean flags ---
        has_analysis = Project.id.in_(select(analysis_project_ids_subq))
        has_chat = Project.key.in_(select(chat_project_keys_subq))
        has_proposal = Project.key.in_(select(proposal_project_keys_subq))
        has_ac = Project.id.in_(select(ac_project_ids_subq))

        projects_with_flags = (
            self.db.query(
                Project,
                case((has_analysis, literal(True)), else_=literal(False)).label(
                    "has_analysis"
                ),
                case((has_chat, literal(True)), else_=literal(False)).label("has_chat"),
                case((has_proposal, literal(True)), else_=literal(False)).label(
                    "has_proposal"
                ),
                case((has_ac, literal(True)), else_=literal(False)).label("has_ac"),
            )
            .filter(Project.connection_id == connection.id)
            .all()
        )

        projects_with_analyses = []
        projects_with_chats = []
        projects_with_proposals = []
        projects_with_ac = []

        for (
            proj,
            flag_analysis,
            flag_chat,
            flag_proposal,
            flag_ac,
        ) in projects_with_flags:
            if flag_analysis:
                projects_with_analyses.append(proj)
            if flag_chat:
                projects_with_chats.append(proj)
            if flag_proposal:
                projects_with_proposals.append(proj)
            if flag_ac:
                projects_with_ac.append(proj)

        return ConnectionDashboardDto(
            num_projects=num_projects,
            num_analyses=num_analyses,
            num_chats=num_chats,
            num_proposals=num_proposals,
            num_acs=num_ac,
            projects_with_analyses=_to_project_dtos(projects_with_analyses),
            projects_with_chats=_to_project_dtos(projects_with_chats),
            projects_with_proposals=_to_project_dtos(projects_with_proposals),
            projects_with_acs=_to_project_dtos(projects_with_ac),
        )
