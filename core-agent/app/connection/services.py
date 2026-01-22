from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, and_, or_, select, distinct

from .schemas import ProjectDashboardDto, StoryDashboardDto
from .jira.models import Connection, Project, Story, GherkinAC
from .jira.schemas import StorySummary
from app.analysis.models import Analysis, Defect, DefectStoryKey
from app.chat.models import ChatSession
from app.proposal.models import Proposal, ProposalContent


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

        # Count stories in the project
        num_stories = (
            self.db.query(func.count(Story.id_))
            .filter(Story.project_id == project.id_)
            .scalar()
        )

        # Count analyses for this project
        num_analyses = (
            self.db.query(func.count(Analysis.id))
            .filter(
                Analysis.connection_id == connection_name,
                Analysis.project_key == project_key,
            )
            .scalar()
        )

        # Count chat sessions for this project
        num_chats = (
            self.db.query(func.count(ChatSession.id))
            .filter(
                ChatSession.connection_id == connection_name,
                ChatSession.project_key == project_key,
            )
            .scalar()
        )

        # Count proposals for this project
        num_proposals = (
            self.db.query(func.count(Proposal.id))
            .filter(
                Proposal.connection_id == connection_name,
                Proposal.project_key == project_key,
            )
            .scalar()
        )

        # Count acceptance criteria (GherkinAC) for all stories in this project
        num_ac = (
            self.db.query(func.count(GherkinAC.id))
            .join(Story)
            .filter(Story.project_id == project.id_)
            .scalar()
        )

        # Subquery: story keys that have analyses (via defects -> defect_story_keys)
        stories_with_analyses_subq = (
            select(distinct(DefectStoryKey.key))
            .join(Defect)
            .join(Analysis)
            .where(
                Analysis.connection_id == connection_name,
                Analysis.project_key == project_key,
            )
            .subquery()
        )

        stories_with_analyses = (
            self.db.query(Story)
            .filter(
                Story.project_id == project.id_,
                Story.key.in_(select(stories_with_analyses_subq)),
            )
            .all()
        )

        # Subquery: story keys that have chat sessions
        stories_with_chats_subq = (
            select(distinct(ChatSession.story_key))
            .where(
                ChatSession.connection_id == connection_name,
                ChatSession.project_key == project_key,
                ChatSession.story_key.isnot(None),
            )
            .subquery()
        )

        stories_with_chats = (
            self.db.query(Story)
            .filter(
                Story.project_id == project.id_,
                Story.key.in_(select(stories_with_chats_subq)),
            )
            .all()
        )

        # Subquery: story keys that have proposals (via proposal_contents)
        stories_with_proposals_subq = (
            select(distinct(ProposalContent.story_key))
            .join(Proposal)
            .where(
                Proposal.connection_id == connection_name,
                Proposal.project_key == project_key,
                ProposalContent.story_key.isnot(None),
            )
            .subquery()
        )

        stories_with_proposals = (
            self.db.query(Story)
            .filter(
                Story.project_id == project.id_,
                Story.key.in_(select(stories_with_proposals_subq)),
            )
            .all()
        )

        # Subquery: story keys that have acceptance criteria
        stories_with_ac_subq = select(distinct(GherkinAC.story_id)).subquery()

        stories_with_ac = (
            self.db.query(Story)
            .filter(
                Story.project_id == project.id_,
                Story.id_.in_(select(stories_with_ac_subq)),
            )
            .all()
        )

        return ProjectDashboardDto(
            num_stories=num_stories,
            num_analyses=num_analyses,
            num_chats=num_chats,
            num_proposals=num_proposals,
            num_acs=num_ac,
            stories_with_analyses=[
                StorySummary(id=s.id_, key=s.key, summary=s.summary)
                for s in stories_with_analyses
            ],
            stories_with_chats=[
                StorySummary(id=s.id_, key=s.key, summary=s.summary)
                for s in stories_with_chats
            ],
            stories_with_proposals=[
                StorySummary(id=s.id_, key=s.key, summary=s.summary)
                for s in stories_with_proposals
            ],
            stories_with_acs=[
                StorySummary(id=s.id_, key=s.key, summary=s.summary)
                for s in stories_with_ac
            ],
        )

    def get_story_dashboard_info(
        self, user_id: str, connection_name: str, project_key: str, story_key: str
    ) -> StoryDashboardDto:
        # Verify the story exists
        story = (
            self.db.query(Story)
            .join(Project)
            .join(Connection)
            .filter(
                Connection.user_id == user_id,
                Connection.name == connection_name,
                Project.key == project_key,
                Story.key == story_key,
            )
            .first()
        )

        if not story:
            raise ValueError("Story not found")

        # Count analyses that reference this story (via defect_story_keys)
        num_analyses = (
            self.db.query(func.count(distinct(Analysis.id)))
            .join(Defect)
            .join(DefectStoryKey)
            .filter(
                Analysis.connection_id == connection_name,
                Analysis.project_key == project_key,
                DefectStoryKey.key == story_key,
            )
            .scalar()
        )

        # Count chat sessions for this specific story
        num_chats = (
            self.db.query(func.count(ChatSession.id))
            .filter(
                ChatSession.connection_id == connection_name,
                ChatSession.project_key == project_key,
                ChatSession.story_key == story_key,
            )
            .scalar()
        )

        # Count proposals that have at least 1 content associated with this story
        num_proposals = (
            self.db.query(func.count(distinct(Proposal.id)))
            .join(ProposalContent)
            .filter(
                Proposal.connection_id == connection_name,
                Proposal.project_key == project_key,
                ProposalContent.story_key == story_key,
            )
            .scalar()
        )

        # Count acceptance criteria for this story
        num_ac = (
            self.db.query(func.count(GherkinAC.id))
            .filter(GherkinAC.story_id == story.id_)
            .scalar()
        )

        return StoryDashboardDto(
            num_analyses=num_analyses,
            num_chats=num_chats,
            num_proposals=num_proposals,
            num_acs=num_ac,
        )
