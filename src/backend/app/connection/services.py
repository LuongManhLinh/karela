from sqlalchemy.orm import Session
from sqlalchemy import func, select, distinct, and_, case, literal

from .schemas import (
    ConnectionDashboardDto,
    ProjectDashboardDto,
    StoryDashboardDto,
    ProjectInfo,
    StoryInfo,
)
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
        self, connection_id: str, project_key: str
    ) -> ProjectDashboardDto:
        # Check project exists
        project = (
            self.db.query(Project)
            .join(Connection)
            .filter(
                Connection.id == connection_id,
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

        # Calculate readiness score efficiently
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

        ac_story_ids_subq = (
            select(distinct(GherkinAC.story_id)).correlate(None).subquery()
        )

        num_ready_stories = (
            self.db.query(func.count(Story.id))
            .filter(
                Story.project_id == project.id,
                Story.id.in_(select(ac_story_ids_subq)),
                ~Story.key.in_(select(defect_story_keys_subq)),
            )
            .scalar()
        )
        
        readiness_score = (
            (num_ready_stories / num_stories * 100) if num_stories > 0 else 0.0
        )

        return ProjectDashboardDto(
            num_stories=num_stories,
            num_analyses=num_analyses,
            num_chats=num_chats,
            num_proposals=num_proposals,
            num_acs=num_ac,
            readiness_score=readiness_score,
        )

    def get_paginated_stories(
        self, connection_id: str, project_key: str, skip: int = 0, limit: int = 10
    ) -> list[StoryInfo]:
        # Check project exists
        project = (
            self.db.query(Project)
            .join(Connection)
            .filter(
                Connection.id == connection_id,
                Project.key == project_key,
            )
            .first()
        )

        if not project:
            raise ValueError("Project not found")

        # Fetch paginated stories
        stories = (
            self.db.query(Story)
            .filter(Story.project_id == project.id)
            .order_by(Story.key)
            .offset(skip)
            .limit(limit)
            .all()
        )

        story_infos = []
        for s in stories:
            s_num_analyses, s_num_proposals, s_num_ac, s_has_defect = self.db.query(
                (
                    select(func.count(distinct(Analysis.id)))
                    .join(Defect)
                    .join(DefectStoryKey)
                    .where(
                        Analysis.connection_id == connection_id,
                        Analysis.project_key == project_key,
                        DefectStoryKey.story_key == s.key,
                    )
                    .correlate(None)
                    .scalar_subquery()
                ),
                (
                    select(func.count(distinct(Proposal.id)))
                    .join(ProposalContent)
                    .where(
                        Proposal.connection_id == connection_id,
                        Proposal.project_key == project_key,
                        ProposalContent.story_key == s.key,
                    )
                    .correlate(None)
                    .scalar_subquery()
                ),
                (
                    select(func.count(GherkinAC.id))
                    .where(GherkinAC.story_id == s.id)
                    .correlate(None)
                    .scalar_subquery()
                ),
                (
                    select(func.count(Defect.id) > 0)
                    .join(DefectStoryKey)
                    .join(Analysis)
                    .where(
                        Analysis.connection_id == connection_id,
                        Analysis.project_key == project_key,
                        DefectStoryKey.story_key == s.key,
                    )
                    .correlate(None)
                    .scalar_subquery()
                ),
            ).one()

            is_ready = s_num_ac > 0 and not s_has_defect

            story_infos.append(
                StoryInfo(
                    id=s.id,
                    key=s.key,
                    analysis_count=s_num_analyses,
                    proposal_count=s_num_proposals,
                    ac_count=s_num_ac,
                    is_ready=is_ready,
                )
            )

        return story_infos

    def get_story_dashboard_info(
        self, connection_id: str, project_key: str, story_key: str
    ) -> StoryDashboardDto:
        # Verify the story exists and get connection_id
        result = (
            self.db.query(Story, Connection.id.label("connection_id"))
            .join(Story.project)
            .join(Project.connection)
            .filter(
                Connection.id == connection_id,
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
        self, connection_id: str
    ) -> ConnectionDashboardDto:
        # Verify the connection exists
        connection = (
            self.db.query(Connection)
            .filter(
                Connection.id == connection_id,
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

        return ConnectionDashboardDto(
            num_projects=num_projects,
            num_analyses=num_analyses,
            num_chats=num_chats,
            num_proposals=num_proposals,
            num_acs=num_ac,
        )

    def get_paginated_projects(
        self, connection_id: str, skip: int = 0, limit: int = 5
    ) -> list[ProjectInfo]:
        # Verify the connection exists
        connection = (
            self.db.query(Connection)
            .filter(
                Connection.id == connection_id,
            )
            .first()
        )

        if not connection:
            raise ValueError("Connection not found")

        # Fetch paginated projects
        projects = (
            self.db.query(Project)
            .filter(Project.connection_id == connection.id)
            .order_by(Project.name)
            .offset(skip)
            .limit(limit)
            .all()
        )

        project_infos = []
        for p in projects:
            p_num_analyses, p_num_chats, p_num_proposals, p_num_ac = self.db.query(
                (
                    select(func.count(Analysis.id))
                    .where(
                        Analysis.connection_id == connection.id,
                        Analysis.project_key == p.key,
                    )
                    .correlate(None)
                    .scalar_subquery()
                ),
                (
                    select(func.count(ChatSession.id))
                    .where(
                        ChatSession.connection_id == connection.id,
                        ChatSession.project_key == p.key,
                    )
                    .correlate(None)
                    .scalar_subquery()
                ),
                (
                    select(func.count(Proposal.id))
                    .where(
                        Proposal.connection_id == connection.id,
                        Proposal.project_key == p.key,
                    )
                    .correlate(None)
                    .scalar_subquery()
                ),
                (
                    select(func.count(GherkinAC.id))
                    .join(Story)
                    .where(Story.project_id == p.id)
                    .correlate(None)
                    .scalar_subquery()
                ),
            ).one()

            project_infos.append(
                ProjectInfo(
                    id=p.id,
                    key=p.key,
                    name=p.name,
                    analysis_count=p_num_analyses,
                    chat_count=p_num_chats,
                    proposal_count=p_num_proposals,
                    ac_count=p_num_ac,
                )
            )

        return project_infos
