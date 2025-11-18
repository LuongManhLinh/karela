from common.database import SessionLocal
from .services import ChatDataService


def chat_with_agent(session_id: str):
    db = SessionLocal()
    try:
        ChatDataService.chat_polling(db, session_id)
    finally:
        db.close()
