from database import SessionLocal
from .services.run_services import DefectRunService
from .services.chat_service import DefectChatService


def analyze_all_user_stories(analysis_id: str):
    db = SessionLocal()
    try:
        DefectRunService.analyze_all_user_stories(db, analysis_id)
    finally:
        db.close()


def analyze_target_user_story(analysis_id: str, target_story_key: str):
    db = SessionLocal()
    try:
        DefectRunService.analyze_target_user_story(db, analysis_id, target_story_key)
    finally:
        db.close()


def chat_with_agent(session_id: str):
    db = SessionLocal()
    try:
        DefectChatService.chat(db, session_id)
    finally:
        db.close()
