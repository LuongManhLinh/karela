from defect.chat_agents.resolver_agent import chat_with_agent
from defect.models import ChatSession
from sqlalchemy.orm import Session


import json


class DefectChatService:
    @staticmethod
    def chat(
        db: Session,
        session_id: str,
        message: str,
        project_key: str,
        story_key: str = None,
    ):
        # Check if session exists
        if not db.query(ChatSession).filter(ChatSession.id == session_id).first():
            raise ValueError(f"Chat session with ID {session_id} does not exist.")

        response = chat_with_agent(
            message=message,
            session_id=session_id,
            db_session=db,
            project_key=project_key,
            story_key=story_key,
        )
        print("Agent response:", json.dumps(response, indent=2))
