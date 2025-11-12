from database import SessionLocal
from .services.run_services import DefectRunService


def analyze_all_user_stories(analysis_id: str):
    db = SessionLocal()
    try:
        DefectRunService.analyze_all(db, analysis_id)
    finally:
        db.close()


def analyze_target_user_story(analysis_id: str, target_story_key: str):
    db = SessionLocal()
    try:
        DefectRunService.analyze_target_story(db, analysis_id, target_story_key)
    finally:
        db.close()
