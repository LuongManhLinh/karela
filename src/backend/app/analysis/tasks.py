from common.database import SessionLocal
from .services import AnalysisRunService
from common.redis_app import task_queue


def _analyze_all_user_stories(analysis_id: str):
    db = SessionLocal()
    try:
        service = AnalysisRunService(db)
        service.analyze_all_user_stories(analysis_id)
    finally:
        db.close()


def _analyze_target_user_story(analysis_id: str):
    db = SessionLocal()
    try:
        service = AnalysisRunService(db)
        service.analyze_target_user_story(analysis_id)
    finally:
        db.close()


def _generate_proposals(analysis_id: str):
    db = SessionLocal()
    try:
        service = AnalysisRunService(db)
        proposal_ids = service.generate_proposals(analysis_id)
        return proposal_ids
    finally:
        db.close()


def analyze_all_user_stories(analysis_id: str):
    job = task_queue.enqueue(_analyze_all_user_stories, analysis_id)
    return job.id


def analyze_target_user_story(analysis_id: str):
    job = task_queue.enqueue(_analyze_target_user_story, analysis_id)
    return job.id


def generate_proposals(analysis_id: str):
    job = task_queue.enqueue(_generate_proposals, analysis_id)
    return job.id
