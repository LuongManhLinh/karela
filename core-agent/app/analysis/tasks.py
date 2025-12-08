from common.database import SessionLocal
from .services import AnalysisRunService


def analyze_all_user_stories(analysis_id: str):
    db = SessionLocal()
    try:
        service = AnalysisRunService(db)
        service.analyze_all_user_stories(analysis_id)
    finally:
        db.close()


def analyze_target_user_story(analysis_id: str):
    db = SessionLocal()
    try:
        service = AnalysisRunService(db)
        service.analyze_target_user_story(analysis_id)
    finally:
        db.close()
