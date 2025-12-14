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
from app.integrations.jira.schemas import CreateStoryRequest
from app.analysis.services.defect_service import DefectService
from common.database import uuid_generator
from common.schemas import SessionSummary


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

    def _accept_proposal_contents(
        self,
        connection_id,
        project_key: str,
        contents: List[ProposalContent],
    ):
        num_created = 0
        num_updated = 0
        num_deleted = 0
        try:
            platform_service = get_platform_service(
                db=self.db, connection_id=connection_id
            )
            create_contents = []
            update_keys = []
            delete_keys = []
            content_lookup = {}  # For update and delete operations
            for content in contents:
                key = content.story_key
                if content.type == ProposalType.CREATE:
                    create_contents.append(content)
                elif content.type == ProposalType.UPDATE:
                    update_keys.append(key)
                    content_lookup[key] = content
                elif content.type == ProposalType.DELETE:
                    delete_keys.append(key)
                    content_lookup[key] = content
                    # Query the latest version
            sub = (
                self.db.query(
                    StoryVersion.key,
                    func.max(StoryVersion.version).label("latest_version"),
                )
                .filter(StoryVersion.key.in_([*update_keys, *delete_keys]))
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

            # Create new issues
            if create_contents:
                for content in create_contents:
                    new_story = CreateStoryRequest(
                        summary=content.summary,
                        description=content.description,
                    )
                    created_key = platform_service.create_story(
                        connection_id=connection_id,
                        project_key=project_key,
                        story=new_story,
                    )
                    num_created += 1

                    # Store the created story version
                    new_version = StoryVersion(
                        key=created_key,
                        version=0,
                        summary=content.summary,
                        description=content.description,
                        action=ProposalType.CREATE,
                    )
                    self.db.add(new_version)

            # Update existing issues
            if update_keys:
                # Search for existing issues to back up their versions before modification
                existing_stories = platform_service.fetch_stories(
                    connection_id=connection_id,
                    project_key=project_key,
                    story_keys=update_keys,
                )

                for story_dto in existing_stories:
                    existing_version = version_lookup.get(story_dto.key)
                    version = 0
                    if existing_version:
                        version = existing_version.version + 1
                    new_version = StoryVersion(
                        id=story_dto.id,
                        key=story_dto.key,
                        version=version,
                        summary=story_dto.summary,
                        description=story_dto.description,
                        action=ProposalType.UPDATE,
                    )
                    self.db.add(new_version)

                    content = content_lookup.get(story_dto.key)
                    platform_service.update_issue(
                        connection_id=connection_id,
                        issue_key=story_dto.key,
                        summary=content.summary,
                        description=content.description,
                    )
                    num_updated += 1

            # Delete issues
            if delete_keys:
                # Search for existing issues to back up their versions before deletion
                existing_stories = platform_service.fetch_stories(
                    connection_id=connection_id,
                    project_key=project_key,
                    story_keys=delete_keys,
                )

                for story_dto in existing_stories:
                    existing_version = version_lookup.get(story_dto.key)
                    version = 0
                    if existing_version:
                        version = existing_version.version + 1
                    new_version = StoryVersion(
                        id=story_dto.id,
                        key=story_dto.key,
                        version=version,
                        summary=story_dto.summary,
                        description=story_dto.description,
                        action=ProposalType.DELETE,
                    )
                    self.db.add(new_version)

                    platform_service.delete_issue(
                        connection_id=connection_id,
                        issue_key=story_dto.key,
                    )
                    num_deleted += 1
            for content in contents:
                content.accepted = True
                self.db.add(content)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise e

        return num_created, num_updated, num_deleted

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
        proposal = (
            self.db.execute(
                select(Proposal)
                .where(Proposal.id == proposal_id)
                .options(selectinload(Proposal.contents))
            )
            .unique()
            .scalar_one_or_none()
        )
        if not proposal:
            raise ValueError(f"Proposal with id {proposal_id} not found")

        connection_id = proposal.connection_id
        project_key = proposal.project_key

        self._accept_proposal_contents(
            connection_id=connection_id,
            project_key=project_key,
            contents=proposal.contents,
        )

        proposal.accepted = True
        self.db.add(proposal)
        self.db.commit()

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
        proposal = content.proposal
        connection_id = proposal.connection_id
        project_key = proposal.project_key
        self._accept_proposal_contents(
            connection_id=connection_id,
            project_key=project_key,
            contents=[content],
        )

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
        # Import here to avoid circular dependencies
        from app.analysis.models import Analysis
        from app.chat.models import ChatSession

        # Query distinct analysis sessions that have proposals
        analysis_sessions = (
            self.db.query(Analysis)
            .join(Proposal, Proposal.analysis_session_id == Analysis.id)
            .filter(
                Proposal.connection_id == connection_id,
                Proposal.source == ProposalSource.ANALYSIS,
                Analysis.connection_id == connection_id,
            )
            .distinct()
            .all()
        )

        # Query distinct chat sessions that have proposals
        chat_sessions = (
            self.db.query(ChatSession)
            .join(Proposal, Proposal.chat_session_id == ChatSession.id)
            .filter(
                Proposal.connection_id == connection_id,
                Proposal.source == ProposalSource.CHAT,
                ChatSession.connection_id == connection_id,
            )
            .distinct()
            .all()
        )

        return SessionsHavingProposals(
            analysis_sessions=[
                SessionSummary(
                    id=analysis.id,
                    key=analysis.key,
                    project_key=analysis.project_key,
                    created_at=analysis.created_at.isoformat(),
                )
                for analysis in analysis_sessions
            ],
            chat_sessions=[
                SessionSummary(
                    id=chat.id,
                    key=chat.key,
                    project_key=chat.project_key,
                    story_key=chat.story_key,
                    created_at=chat.created_at.isoformat(),
                )
                for chat in chat_sessions
            ],
        )

    def _revert_applied_proposal_contents(
        self,
        connection_id,
        contents: List[ProposalContent],
    ):
        try:
            platform_service = get_platform_service(
                db=self.db, connection_id=connection_id
            )

            for content in contents:
                if content.accepted is not True:
                    continue
                latest_version = (
                    self.db.query(StoryVersion)
                    .filter(StoryVersion.key == content.key)
                    .order_by(StoryVersion.version.desc())
                    .first()
                )
                if latest_version:
                    match latest_version.action:
                        case ProposalType.UPDATE:
                            platform_service.update_issue(
                                connection_id=connection_id,
                                issue_key=latest_version.key,
                                summary=latest_version.summary,
                                description=latest_version.description,
                            )
                        case ProposalType.CREATE:
                            platform_service.delete_issue(
                                connection_id=connection_id,
                                issue_key=latest_version.key,
                            )
                        case ProposalType.DELETE:
                            platform_service.create_stories(
                                connection_id=connection_id,
                                project_key=content.proposal.project_key,
                                stories=[
                                    CreateStoryRequest(
                                        summary=latest_version.summary,
                                        description=latest_version.description,
                                    )
                                ],
                            )
                    self.db.delete(latest_version)

                content.accepted = None  # Mark as pending again
                self.db.add(content)
            self.db.commit()
        except Exception as e:
            self.db.rollback()
            raise e

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

        self._revert_applied_proposal_contents(
            connection_id=connection_id,
            contents=proposal.contents,
        )

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

        if content.accepted is not True:
            raise ValueError(
                f"ProposalContent with id {proposal_content_id} is not an accepted UPDATE"
            )

        proposal = content.proposal
        connection_id = proposal.connection_id
        self._revert_applied_proposal_contents(
            connection_id=connection_id,
            contents=[content],
        )

    def edit_proposal_content(
        self,
        proposal_content_id: str,
        summary: str | None,
        description: str | None,
    ):
        """Edits a proposal content's summary and/or description.
        Args:
            proposal_content_id (str): The ID of the proposal content to edit.
            summary (str | None): The new summary. If None, the summary is not changed.
            description (str | None): The new description. If None, the description is not changed.
        """
        if not summary and not description:
            raise ValueError("At least one of summary or description must be provided")
        content = (
            self.db.query(ProposalContent)
            .filter(ProposalContent.id == proposal_content_id)
            .first()
        )
        if not content:
            raise ValueError(f"ProposalContent with id {proposal_content_id} not found")
        if content.type not in [ProposalType.CREATE, ProposalType.UPDATE]:
            raise Exception("Only CREATE and UPDATE proposal contents can be edited")

        if summary:
            content.summary = summary
        if description:
            content.description = description

        self.db.add(content)
        self.db.commit()
