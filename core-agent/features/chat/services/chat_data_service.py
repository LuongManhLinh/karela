from features.integrations.jira.schemas import IssuesCreateRequest
from sqlalchemy.orm import Session
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from ..models import (
    WorkItemVersion,
    StoryChangeProposal,
    StoryChangeContent,
    ProposalType,
    ChatSession,
    SenderRole,
    Message,
)
from ..schemas import (
    ChatProposalContentDto,
    ChatProposalDto,
    ChatMessageDto,
    ChatSessionDto,
    ChatSessionSummary,
)
from features.integrations import get_platform_service
from common.database import uuid_generator
from utils.markdown_adf_bridge.markdown_adf_bridge import adf_to_md, md_to_adf


from sqlalchemy import func
from sqlalchemy.orm import Session


from typing import List, Optional


class ChatDataService:
    @staticmethod
    def create_chat_session(
        db: Session,
        user_id: str,
        connection_id: str,
        project_key: str,
        story_key: str = None,
    ):
        chat_session = ChatSession(
            user_id=user_id,
            connection_id=connection_id,
            project_key=project_key,
            story_key=story_key,
        )

        db.add(chat_session)
        db.commit()
        db.refresh(chat_session)

        return chat_session.id

    @staticmethod
    def create_chat_message(
        db: Session,
        session_id: str,
        role: str,
        content: str,
        analysis_id: Optional[str] = None,
    ):
        message = Message(
            session_id=session_id,
            role=SenderRole(role),
            content=content,
            analysis_id=analysis_id,
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message.id, message.created_at.isoformat()

    @staticmethod
    def list_chat_sessions(db: Session, user_id: str, connection_id: str):
        sessions = (
            db.query(ChatSession)
            .filter(
                ChatSession.user_id == user_id,
                ChatSession.connection_id == connection_id,
            )
            .order_by(ChatSession.created_at.desc())
            .all()
        )

        return [
            ChatSessionSummary(
                id=session.id,
                project_key=session.project_key,
                story_key=session.story_key,
                created_at=session.created_at.isoformat(),
            )
            for session in sessions
        ]

    @staticmethod
    def get_chat_session(db: Session, session_id: str) -> Optional[ChatSessionDto]:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            return None

        return ChatDataService._get_chat_session_dto(db, session)

    @staticmethod
    def _get_chat_session_dto(db: Session, chat_session: ChatSession) -> ChatSessionDto:
        messages = []
        for message in chat_session.messages:
            msg_dto = ChatMessageDto(
                id=message.id,
                role=message.role.value,
                content=message.content,
                created_at=message.created_at.isoformat(),
            )

            messages.append(msg_dto)

        return ChatSessionDto(
            id=chat_session.id,
            project_key=chat_session.project_key,
            story_key=chat_session.story_key,
            created_at=chat_session.created_at.isoformat(),
            messages=messages,
            change_proposals=[
                ChatProposalDto(
                    id=proposal.id,
                    session_id=proposal.session_id,
                    project_key=proposal.project_key,
                    type=proposal.type.value,
                    accepted=proposal.accepted,
                    created_at=proposal.created_at.isoformat(),
                    contents=[
                        ChatProposalContentDto(
                            story_key=content.story_key,
                            summary=content.summary,
                            description=content.description,
                        )
                        for content in proposal.contents
                    ],
                )
                for proposal in chat_session.change_proposals
            ],
        )

    @staticmethod
    def get_latest_messages_after(
        db: Session, session_id: str, message_id: int
    ) -> List[ChatMessageDto]:
        """Fetch chat messages in a session after a specific message ID. Support polling."""
        messages = (
            db.query(Message)
            .filter(Message.session_id == session_id, Message.id > message_id)
            .order_by(Message.created_at.asc())
            .all()
        )
        return [
            ChatMessageDto(
                id=message.id,
                role=message.role.value,
                content=message.content,
                analysis_id=message.analysis_id,
                created_at=message.created_at.isoformat(),
            )
            for message in messages
        ]

    @staticmethod
    def propose_modifying_stories(
        db: Session, session_id: str, project_key: str, modifications: list[dict]
    ):
        keys = []
        contents = []

        for mod in modifications:
            key = mod.get("key")
            if not key:
                continue

            summary = mod.get("summary")
            description = mod.get("description")
            if not summary and not description:
                continue

            keys.append(key)
            content = StoryChangeContent(
                key=key,
                summary=summary,
                description=description,
            )
            contents.append(content)

        id = uuid_generator()
        proposal = StoryChangeProposal(
            id=id, session_id=session_id, project_key=project_key, contents=contents
        )

        db.add(proposal)
        db.commit()

        return id, keys

    @staticmethod
    def _accept_updating_stories(
        db: Session, connection_id: str, proposal: StoryChangeProposal
    ):
        proposal_contents = proposal.contents
        keys = []
        valid_modifications = {}
        for content in proposal_contents:
            keys.append(content.key)
            valid_modifications[content.key] = {
                "summary": content.summary,
                "description": content.description,
            }
        platform_service = get_platform_service(connection_id)
        issues = platform_service.search_issues(
            jql=f'project="{proposal.project_key}" AND key IN ({",".join(keys)}) AND issuetype="Story"',
            fields=["Summary", "Description"],
            max_results=len(keys),
            expand_rendered_fields=False,
        ).issues
        sub = (
            db.query(
                WorkItemVersion.key,
                func.max(WorkItemVersion.version).label("latest_version"),
            )
            .filter(WorkItemVersion.key.in_(keys))
            .group_by(WorkItemVersion.key)
            .subquery()
        )

        rows = (
            db.query(WorkItemVersion)
            .join(
                sub,
                (WorkItemVersion.key == sub.c.key)
                & (WorkItemVersion.version == sub.c.latest_version),
            )
            .all()
        )

        version_lookup = {v.key: v for v in rows}

        for issue in issues:
            # Save a version before modifying
            existing_version = version_lookup.get(issue.key)
            if existing_version:
                existing_version.version += 1
            else:
                existing_version = WorkItemVersion(
                    key=issue.key,
                    summary=issue.fields.summary,
                    description=adf_to_md(issue.fields.description),
                )
            db.add(existing_version)

            mod = valid_modifications.get(issue.key)
            update_fields = {"issue_id": issue.id, "summary": mod.get("summary")}
            updated_description = mod.get("description")
            if updated_description:
                update_fields["description"] = md_to_adf(updated_description)

            platform_service.modify_issue(**update_fields)
        proposal.accepted = True
        db.add(proposal)
        db.commit()

    @staticmethod
    def propose_creating_stories(
        db: Session, session_id: str, project_key: str, stories: list[dict]
    ) -> List[str]:
        content = []
        for story in stories:
            summary = story.get("summary")
            description = story.get("description")
            if summary and description:
                content.append(
                    StoryChangeContent(
                        summary=summary,
                        description=description,
                    )
                )

        id = uuid_generator()
        proposal = StoryChangeProposal(
            id=id,
            session_id=session_id,
            project_key=project_key,
            type=ProposalType.CREATE,
            contents=content,
        )
        db.add(proposal)
        db.commit()
        return id, len(content)

    @staticmethod
    def _accept_creating_stories(
        db: Session, connection_id: str, proposal: StoryChangeProposal
    ):
        stories = proposal.contents
        project_key = proposal.project_key
        platform_service = get_platform_service(connection_id)
        created_keys = platform_service.create_issues(
            issues=IssuesCreateRequest(
                **{
                    "issueUpdates": [
                        {
                            "fields": {
                                "project": {"key": project_key},
                                "summary": story["summary"],
                                "description": md_to_adf(story["description"]),
                                "issuetype": {"name": "Story"},
                            }
                        }
                        for story in stories
                    ]
                }
            )
        )
        proposal.accepted = True
        db.add(proposal)
        db.commit()

        return created_keys

    @staticmethod
    def _get_connection_id_for_proposal(
        db: Session, proposal: StoryChangeProposal
    ) -> str:
        connection_id = (
            db.query(ChatSession.connection_id)
            .filter(ChatSession.id == proposal.session_id)
            .scalar()
        )
        if not connection_id:
            raise ValueError(
                f"Connection ID not found for chat session {proposal.session_id}"
            )
        return connection_id

    @staticmethod
    def accept_proposal(db: Session, proposal_id: str):
        proposal = (
            db.query(StoryChangeProposal)
            .filter(StoryChangeProposal.id == proposal_id)
            .first()
        )
        if not proposal:
            raise ValueError(f"Proposal with id {proposal_id} not found")
        connection_id = ChatDataService._get_connection_id_for_proposal(db, proposal)

        if proposal.type == ProposalType.UPDATE:
            ChatDataService._accept_updating_stories(db, connection_id, proposal)
        elif proposal.type == ProposalType.CREATE:
            ChatDataService._accept_creating_stories(db, connection_id, proposal)
        else:
            raise ValueError(f"Unknown proposal type: {proposal.type}")

    @staticmethod
    def reject_proposal(db: Session, proposal_id: str):
        proposal = (
            db.query(StoryChangeProposal)
            .filter(StoryChangeProposal.id == proposal_id)
            .first()
        )
        if not proposal:
            raise ValueError(f"Proposal with id {proposal_id} not found")

        proposal.accepted = False
        db.add(proposal)
        db.commit()

    @staticmethod
    def revert_applied_proposal(db: Session, proposal_id: str):
        proposal = (
            db.query(StoryChangeProposal)
            .filter(StoryChangeProposal.id == proposal_id)
            .first()
        )
        if not proposal:
            raise ValueError(f"Proposal with id {proposal_id} not found")
        if proposal.accepted is not True:
            raise ValueError("Only accepted proposals can be reverted")

        if proposal.type != ProposalType.UPDATE:
            raise ValueError("Only UPDATE proposals can be reverted")

        connection_id = ChatDataService._get_connection_id_for_proposal(db, proposal)
        platform_service = get_platform_service(connection_id)

        for content in proposal.contents:
            latest_version = (
                db.query(WorkItemVersion)
                .filter(WorkItemVersion.key == content.key)
                .order_by(WorkItemVersion.version.desc())
                .first()
            )
            if latest_version and latest_version.version > 0:
                previous_version = (
                    db.query(WorkItemVersion)
                    .filter(
                        WorkItemVersion.key == content.key,
                        WorkItemVersion.version == latest_version.version - 1,
                    )
                    .first()
                )
                if previous_version:
                    platform_service.modify_issue(
                        issue_id=latest_version.issue_id,
                        summary=previous_version.summary,
                        description=md_to_adf(previous_version.description),
                    )
        proposal.accepted = None  # Mark as pending again
        db.add(proposal)
        db.commit()

    @staticmethod
    def create_analysis_progress_message(
        db: Session, session_id: str, analysis_id: str
    ):
        message = Message(
            session_id=session_id,
            role=SenderRole.ANALYSIS_PROGRESS,
            content="",
            analysis_id=analysis_id,
        )
        db.add(message)
        db.commit()

    @staticmethod
    def get_proposal(db: Session, proposal_id: str) -> Optional[ChatProposalDto]:
        proposal = (
            db.query(StoryChangeProposal)
            .filter(StoryChangeProposal.id == proposal_id)
            .first()
        )
        if not proposal:
            return None

        return ChatProposalDto(
            id=proposal.id,
            session_id=proposal.session_id,
            project_key=proposal.project_key,
            type=proposal.type.value,
            accepted=proposal.accepted,
            created_at=proposal.created_at.isoformat(),
            contents=[
                ChatProposalContentDto(
                    story_key=content.story_key,
                    summary=content.summary,
                    description=content.description,
                )
                for content in proposal.contents
            ],
        )
