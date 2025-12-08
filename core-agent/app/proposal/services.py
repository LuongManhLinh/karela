from typing import List, Literal
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, select


from .models import (
    Proposal,
    ProposalContent,
    ProposalDefect,
    ProposalType,
    StoryVersion,
    ProposalSource,
)
from .schemas import (
    CreateProposalRequest,
    ProposalDto,
    ProposalContentDto,
    SessionsHavingProposals,
)
from app.integrations import get_platform_service
from app.integrations.jira.schemas import IssuesCreateRequest
from app.analysis.services.defect_service import DefectService
from common.database import uuid_generator
from common.schemas import SessionSummary
from utils.markdown_adf_bridge import md_to_adf, adf_to_md


class ProposalService:
    def __init__(self, db: Session):
        self.db = db

    def create_proposal(self, proposal_request: CreateProposalRequest):
        """Creates a new proposal with its contents.

        Args:
            proposal_request (CreateProposalRequest): The proposal creation request.
        Returns:
            str: The ID of the created proposal.
        """
        contents = []
        for story in proposal_request.stories:
            content = ProposalContent(
                type=ProposalType(story.type),
                story_key=story.key,
                summary=story.summary,
                description=story.description,
                explanation=story.explanation,
            )
            contents.append(content)

        id = uuid_generator()
        source = ProposalSource(proposal_request.source)

        stmt = select(func.count(Proposal.id)).filter(
            Proposal.connection_id == proposal_request.connection_id,
            Proposal.project_key == proposal_request.project_key,
        )

        proposal_count = self.db.execute(stmt).scalar_one()

        proposal = Proposal(
            id=id,
            key=f"{proposal_request.project_key}-PRS-{proposal_count + 1}",
            connection_id=proposal_request.connection_id,
            source=source,
            project_key=proposal_request.project_key,
            contents=contents,
        )

        if proposal_request.target_defect_ids:
            proposal.proposal_defects = [
                ProposalDefect(defect_id=defect_id)
                for defect_id in proposal_request.target_defect_ids
            ]

        if source == ProposalSource.CHAT:
            proposal.chat_session_id = proposal_request.session_id
        else:
            proposal.analysis_session_id = proposal_request.session_id

        self.db.add(proposal)
        self.db.commit()

        return id

    def create_proposals(
        self, proposal_requests: List[CreateProposalRequest]
    ) -> List[str]:
        """Creates multiple proposals with their contents.

        Args:
            proposal_requests (List[CreateProposalRequest]): The list of proposal creation requests.
        Returns:
            List[str]: The list of IDs of the created proposals.
        """
        created_ids = []
        for proposal_request in proposal_requests:
            proposal_id = self.create_proposal(proposal_request)
            created_ids.append(proposal_id)
        return created_ids

    def accept_proposal(self, proposal_id: str):
        """Applies all the contents of the proposal to the platform.
            Creates a version for each updated story.
            The UNKNOWN type contents are ignored.
        Args:
            proposal_id (str): The ID of the proposal to accept.
        Returns:
            Tuple[List[str], List[str]]: A tuple containing two lists:
                - The list of created issue keys.
                - The list of updated issue keys.
        """
        proposal = self.db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise ValueError(f"Proposal with id {proposal_id} not found")

        connection_id = proposal.connection_id
        project_key = proposal.project_key

        platform_service = get_platform_service(db=self.db, connection_id=connection_id)

        create_contents = []
        update_keys = []
        content_lookup = {}  # For update and delete operations
        for content in proposal.contents:
            if content.type == ProposalType.CREATE:
                create_contents.append(content)
            elif content.type == ProposalType.UPDATE:
                update_keys.append(content.key)
                content_lookup[content.key] = content

        # Create new issues
        created_keys = platform_service.create_issues(
            issues=IssuesCreateRequest(
                **{
                    "issueUpdates": [
                        {
                            "fields": {
                                "project": {"key": project_key},
                                "summary": content.summary,
                                "description": md_to_adf(content.description),
                                "issuetype": {"name": "Story"},
                            }
                        }
                        for content in create_contents
                    ]
                }
            )
        )

        # Update existing issues
        if update_keys:
            # Search for existing issues to back up their versions before modification
            issues = platform_service.search_issues(
                jql=f'project="{project_key}" AND key IN ({",".join(update_keys)}) AND issuetype="Story"',
                fields=["Summary", "Description"],
                max_results=len(update_keys),
                expand_rendered_fields=False,
            )

            # Query latest versions from WorkItemVersion table
            sub = (
                self.db.query(
                    StoryVersion.key,
                    func.max(StoryVersion.version).label("latest_version"),
                )
                .filter(StoryVersion.key.in_(update_keys))
                .group_by(StoryVersion.key)
                .subquery()
            )
            rows = (
                self.db.query(StoryVersion)
                .join(
                    sub,
                    (StoryVersion.key == sub.c.key)
                    & (StoryVersion.version == sub.c.latest_version),
                )
                .all()
            )

            version_lookup = {v.key: v for v in rows}
            for issue in issues:
                existing_version = version_lookup.get(issue.key)
                version = 0
                if existing_version:
                    version = existing_version.version + 1
                new_version = StoryVersion(
                    key=issue.key,
                    version=version,
                    summary=issue.fields.summary,
                    description=adf_to_md(issue.fields.description),
                )
                self.db.add(new_version)

                content = content_lookup.get(issue.key)
                platform_service.update_issue(
                    connection_id=connection_id,
                    issue_key=issue.key,
                    summary=content.summary,
                    description=content.description,
                )

        proposal.accepted = True
        self.db.add(proposal)
        self.db.commit()

        return created_keys, update_keys

    def accept_proposal_content(self, proposal_content_id: str):
        """Applies a single proposal content to the platform.
            Creates a version for updated stories.
            The UNKNOWN type contents are ignored.
        Args:
            proposal_content_id (str): The ID of the proposal content to accept.
        """
        content = (
            self.db.query(ProposalContent)
            .filter(ProposalContent.id == proposal_content_id)
            .first()
        )
        if not content:
            raise ValueError(f"ProposalContent with id {proposal_content_id} not found")

        connection_id = content.proposal.connection_id
        platform_service = get_platform_service(db=self.db, connection_id=connection_id)

        if content.type == ProposalType.UPDATE:
            latest_version = (
                self.db.query(StoryVersion)
                .filter(StoryVersion.key == content.story_key)
                .order_by(StoryVersion.version.desc())
                .first()
            )
            version = 0
            if latest_version:
                version = latest_version.version + 1
            new_version = StoryVersion(
                key=content.story_key,
                version=version,
                summary=content.summary,
                description=content.description,
            )
            self.db.add(new_version)

            platform_service.update_issue(
                connection_id=connection_id,
                issue_key=content.story_key,
                summary=content.summary,
                description=content.description,
            )
        elif content.type == ProposalType.CREATE:
            platform_service.create_issues(
                issues=IssuesCreateRequest(
                    **{
                        "issueUpdates": [
                            {
                                "fields": {
                                    "project": {"key": content.proposal.project_key},
                                    "summary": content.summary,
                                    "description": md_to_adf(content.description),
                                    "issuetype": {"name": "Story"},
                                }
                            }
                        ]
                    }
                )
            )

        content.accepted = True
        self.db.add(content)
        self.db.commit()

    def reject_proposal(self, proposal_id: str):
        """Marks all contents of the proposal as rejected.

        Args:
            proposal_id (str): The ID of the proposal to reject.
        """
        proposal = self.db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise ValueError(f"Proposal with id {proposal_id} not found")

        for content in proposal.contents:
            content.accepted = False
        self.db.add(proposal)
        self.db.commit()

    def reject_proposal_content(self, proposal_content_id: str):
        """Marks a single proposal content as rejected.

        Args:
            proposal_content_id (str): The ID of the proposal content to reject.
        """
        content = (
            self.db.query(ProposalContent)
            .filter(ProposalContent.id == proposal_content_id)
            .first()
        )
        if not content:
            raise ValueError(f"ProposalContent with id {proposal_content_id} not found")

        content.accepted = False
        self.db.add(content)
        self.db.commit()

    def _get_proposal_dto(self, proposal: Proposal) -> ProposalDto:
        return ProposalDto(
            id=proposal.id,
            key=proposal.key,
            source=proposal.source.value,
            session_id=(
                proposal.chat_session_id
                if proposal.source == ProposalSource.CHAT
                else proposal.analysis_session_id
            ),
            project_key=proposal.project_key,
            created_at=proposal.created_at.isoformat(),
            contents=[
                ProposalContentDto(
                    id=content.id,
                    type=content.type.value,
                    story_key=content.story_key,
                    summary=content.summary,
                    description=content.description,
                    explanation=content.explanation,
                    accepted=content.accepted,
                )
                for content in proposal.contents
            ],
            target_defect_keys=(
                DefectService(self.db).get_defect_keys_by_ids(
                    [pd.defect_id for pd in proposal.proposal_defects]
                )
                if proposal.proposal_defects
                else None
            ),
        )

    def get_proposal(self, proposal_id: str) -> ProposalDto:
        """Retrieves a proposal by its ID."""
        proposal = self.db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise ValueError(f"Proposal with id {proposal_id} not found")
        return self._get_proposal_dto(proposal)

    def get_proposals_by_session(
        self, session_id: str, source: Literal["CHAT", "ANALYSIS"]
    ) -> List[ProposalDto]:
        """Retrieves all proposals for a given session ID and source.
        Args:
            session_id (str): The session ID.
            source (Literal["CHAT", "ANALYSIS"]): The source of the proposals.
        """
        source_enum = ProposalSource(source)
        query = self.db.query(Proposal).filter(Proposal.source == source_enum)
        if source_enum == ProposalSource.CHAT:
            query = query.filter(Proposal.chat_session_id == session_id)
        else:
            query = query.filter(Proposal.analysis_session_id == session_id)

        proposals = query.all()
        return [self._get_proposal_dto(proposal) for proposal in proposals]

    def get_sessions_having_proposals(
        self, connection_id: str
    ) -> SessionsHavingProposals:
        """Retrieves all proposals for a given connection ID.
        Args:
            connection_id (str): The connection ID.
        """
        proposals = (
            self.db.execute(
                select(Proposal)
                .filter(Proposal.connection_id == connection_id)
                .options(
                    selectinload(Proposal.analysis),
                    selectinload(Proposal.chat_session),
                )
            )
            .unique()
            .scalars()
            .all()
        )

        analysis_sessions = []
        chat_sessions = []

        for proposal in proposals:
            src = proposal.source
            if src == ProposalSource.ANALYSIS and proposal.analysis:
                analysis = proposal.analysis
                analysis_sessions.append(
                    SessionSummary(
                        id=analysis.id,
                        key=analysis.key,
                        project_key=analysis.project_key,
                        created_at=analysis.created_at.isoformat(),
                    )
                )
            elif src == ProposalSource.CHAT and proposal.chat_session:
                chat_session = proposal.chat_session
                chat_sessions.append(
                    SessionSummary(
                        id=chat_session.id,
                        key=chat_session.key,
                        project_key=chat_session.project_key,
                        story_key=chat_session.story_key,
                        created_at=chat_session.created_at.isoformat(),
                    )
                )

        return SessionsHavingProposals(
            analysis_sessions=analysis_sessions,
            chat_sessions=chat_sessions,
        )

    def revert_applied_proposal(self, proposal_id: str):
        """Reverts all accepted contents of the proposal.
            The changes made by accepted UPDATE contents are reverted to the previous version if any.
        Args:
            proposal_id (str): The ID of the proposal to revert.
        """
        proposal = self.db.query(Proposal).filter(Proposal.id == proposal_id).first()
        if not proposal:
            raise ValueError(f"Proposal with id {proposal_id} not found")

        connection_id = proposal.connection_id
        platform_service = get_platform_service(db=self.db, connection_id=connection_id)

        for content in proposal.contents:
            # Only revert accepted updates
            if content.type != ProposalType.UPDATE or content.accepted is not True:
                continue
            latest_version = (
                self.db.query(StoryVersion)
                .filter(StoryVersion.key == content.key)
                .order_by(StoryVersion.version.desc())
                .first()
            )
            if latest_version and latest_version.version > 0:
                previous_version = (
                    self.db.query(StoryVersion)
                    .filter(
                        StoryVersion.key == content.key,
                        StoryVersion.version == latest_version.version - 1,
                    )
                    .first()
                )
                if previous_version:
                    platform_service.update_issue(
                        connection_id=connection_id,
                        issue_key=latest_version.key,
                        summary=previous_version.summary,
                        description=previous_version.description,
                    )
            content.accepted = None  # Mark as pending again
        self.db.add(proposal)
        self.db.commit()

    def revert_applied_proposal_content(self, proposal_content_id: str):
        """Reverts a single accepted proposal content.
            The changes made by an accepted UPDATE content are reverted to the previous version if any.
        Args:
            proposal_content_id (str): The ID of the proposal content to revert.
        """
        content = (
            self.db.query(ProposalContent)
            .filter(ProposalContent.id == proposal_content_id)
            .first()
        )
        if not content:
            raise ValueError(f"ProposalContent with id {proposal_content_id} not found")

        if content.type != ProposalType.UPDATE or content.accepted is not True:
            raise ValueError(
                f"ProposalContent with id {proposal_content_id} is not an accepted UPDATE"
            )

        proposal = content.proposal
        connection_id = proposal.connection_id
        platform_service = get_platform_service(db=self.db, connection_id=connection_id)

        latest_version = (
            self.db.query(StoryVersion)
            .filter(StoryVersion.key == content.story_key)
            .order_by(StoryVersion.version.desc())
            .first()
        )
        if latest_version and latest_version.version >= 0:
            previous_version = (
                self.db.query(StoryVersion)
                .filter(
                    StoryVersion.key == content.story_key,
                    StoryVersion.version == latest_version.version - 1,
                )
                .first()
            )
            if previous_version:
                platform_service.update_issue(
                    connection_id=connection_id,
                    issue_key=latest_version.key,
                    summary=previous_version.summary,
                    description=previous_version.description,
                )
        content.accepted = None  # Mark as pending again
        self.db.add(proposal)
        self.db.commit()
