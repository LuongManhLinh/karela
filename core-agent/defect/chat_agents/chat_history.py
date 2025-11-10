from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage
from sqlalchemy.orm import Session

from ..models import Message, SenderRole


class SQLChatMessageHistory(BaseChatMessageHistory):
    def __init__(self, db: Session, session_id: str):
        self.db = db
        self.session_id = session_id

    @property
    def messages(self):
        rows = (
            self.db.query(Message)
            .filter(Message.session_id == self.session_id)
            .order_by(Message.created_at.asc())
            .all()
        )

        result = []
        for row in rows:
            if row.role == SenderRole.HUMAN:
                result.append(HumanMessage(content=row.content))
            else:
                result.append(AIMessage(content=row.content))
        return result

    def add_message(self, message):
        role = SenderRole.HUMAN if isinstance(message, HumanMessage) else SenderRole.AI

        self.db.add(
            Message(
                session_id=self.session_id,
                role=role,
                content=message.content,
            )
        )
        self.db.commit()

    def clear(self):
        from models import Message

        self.db.query(Message).filter(Message.session_id == self.session_id).delete()
        self.db.commit()


def get_session_history_from_config(config):
    session_id = config["configurable"]["session_id"]
    db = config["configurable"]["db"]
    return SQLChatMessageHistory(db=db, session_id=session_id)
