from database import SessionLocal
from .service import DefectRunService


def run_analysis_task(analysis_id: str):
    db = SessionLocal()
    try:
        DefectRunService.run_analysis(db, analysis_id)
    finally:
        db.close()
