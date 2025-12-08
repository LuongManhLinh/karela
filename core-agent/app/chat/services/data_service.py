from sqlalchemy.orm import Session

from ...proposal.schemas import ProposalContentDto, ProposalDto

from ..models import (
    ChatSession,
    SenderRole,
    Message,
)
from ..schemas import (
    ChatMessageDto,
    ChatSessionDto,
    ChatSessionSummary,
)

from sqlalchemy.orm import Session
from sqlalchemy import func, select


from typing import List, Optional


class ChatDataService:
    def __init__(self, db: Session):
        self.db = db

    def create_chat_session(
        self,
        connection_id: str,
        project_key: str,
        story_key: str = None,
    ):
        stmt = select(func.count(ChatSession.id)).filter(
            ChatSession.connection_id == connection_id,
            ChatSession.project_key == project_key,
        )
        chat_session_count = self.db.execute(stmt).scalar_one()
        chat_session = ChatSession(
            key=f"{project_key}-CHAT-{chat_session_count + 1}",
            connection_id=connection_id,
            project_key=project_key,
            story_key=story_key,
        )

        self.db.add(chat_session)
        self.db.commit()
        self.db.refresh(chat_session)

        return chat_session.id

    def create_chat_message(
        self,
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
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message.id, message.created_at.isoformat()

    def list_chat_sessions(self, connection_id: str):
        sessions = (
            self.db.query(ChatSession)
            .filter(
                ChatSession.connection_id == connection_id,
            )
            .order_by(ChatSession.created_at.desc())
            .all()
        )

        return [
            ChatSessionSummary(
                id=session.id,
                key=session.key,
                project_key=session.project_key,
                story_key=session.story_key,
                created_at=session.created_at.isoformat(),
            )
            for session in sessions
        ]

    def get_chat_session(self, session_id: str) -> ChatSessionDto:
        session = (
            self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
        )
        if not session:
            raise ValueError(f"Chat session {session_id} not found")
        messages = (
            self.db.query(Message)
            .filter(Message.session_id == session_id)
            .order_by(Message.created_at.asc())
            .all()
        )
        return ChatSessionDto(
            id=session.id,
            key=session.key,
            project_key=session.project_key,
            story_key=session.story_key,
            created_at=session.created_at.isoformat(),
            messages=[
                ChatMessageDto(
                    id=message.id,
                    role=message.role.value,
                    content=message.content,
                    created_at=message.created_at.isoformat(),
                )
                for message in messages
            ],
        )

    def get_latest_messages_after(
        self, session_id: str, message_id: int
    ) -> List[ChatMessageDto]:
        """Fetch chat messages in a session after a specific message ID. Support polling."""
        messages = (
            self.db.query(Message)
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

    def create_analysis_progress_message(self, session_id: str, analysis_id: str):
        message = Message(
            session_id=session_id,
            role=SenderRole.ANALYSIS_PROGRESS,
            content="",
            analysis_id=analysis_id,
        )
        self.db.add(message)
        self.db.commit()
