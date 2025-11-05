from database import SessionLocal
from .service import DefectService


def run_analysis_task(analysis_id: str):
    db = SessionLocal()
    try:
        DefectService.run_analysis(db, analysis_id)
    finally:
        db.close()
