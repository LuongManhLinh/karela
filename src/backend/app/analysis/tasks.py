from common.database import SessionLocal
from .services import AnalysisRunService
from common.redis_app import enqueue_task


def _run_analysis(analysis_id: str):
    db = SessionLocal()
    try:
        service = AnalysisRunService(db)
        service.run_analysis(analysis_id)
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


def run_analysis(connection_id: str, analysis_id: str):
    enqueue_task(
        f=_run_analysis,
        queue_type="analysis",
        analysis_id=analysis_id,
    )


def generate_proposals(connection_id: str, analysis_id: str):
    enqueue_task(
        f=_generate_proposals,
        queue_type="proposal",
        analysis_id=analysis_id,
    )
