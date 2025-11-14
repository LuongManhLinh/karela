from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage
from sqlalchemy.orm import Session
import json


from ..models import Message, SenderRole


def _normalize_content(content):
    if isinstance(content, str):
        return content
    elif isinstance(content, dict):
        # flatten common formats
        if "response" in content:
            return content["response"]
        if "output" in content:
            return content["output"]
        if "capabilities" in content:
            return ", ".join(content["capabilities"])
        # fallback: dump entire JSON
        return json.dumps(content, ensure_ascii=False, indent=2)
    else:
        print("Content is of unknown type:", type(content))
        return json.dumps(content, ensure_ascii=False, indent=2)


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
            if row.role == SenderRole.USER:
                result.append(HumanMessage(content=row.content))
            else:
                result.append(AIMessage(content=row.content))
        return result

    def add_message(self, message):
        role = SenderRole.USER if isinstance(message, HumanMessage) else SenderRole.AI
        content = _normalize_content(message.content)
        print("Role:", role, "\nContent:", content, "\n")
        self.db.add(
            Message(
                session_id=self.session_id,
                role=role,
                content=content,
            )
        )
        self.db.commit()

    def clear(self):
        from models import Message

        self.db.query(Message).filter(Message.session_id == self.session_id).delete()
        self.db.commit()


_session_cache = {}


def get_session_history(session_id: str):
    return _session_cache.get(session_id)


def set_session_history(session_id: str, db: Session):
    history = SQLChatMessageHistory(db=db, session_id=session_id)
    _session_cache[session_id] = history
