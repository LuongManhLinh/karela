from common.database import SessionLocal
from .services import AnalysisRunService
from rq.decorators import job
from common.redis_app import redis_client


@job("analysis", timeout=3600, connection=redis_client)
def run_analysis(analysis_id: str):
    print(f"Starting analysis run for analysis_id: {analysis_id}")
    db = SessionLocal()
    try:
        service = AnalysisRunService(db)
        service.run_analysis(analysis_id)
    finally:
        db.close()


@job("proposal", timeout=3600, connection=redis_client)
def generate_proposals(analysis_id: str):
    print(f"Starting proposal generation for analysis_id: {analysis_id}")
    db = SessionLocal()
    try:
        service = AnalysisRunService(db)
        proposal_ids = service.generate_proposals(analysis_id)
        return proposal_ids
    finally:
        db.close()
