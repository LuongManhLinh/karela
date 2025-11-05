from fastapi import APIRouter, HTTPException, Depends
from typing import List

from database import get_db
from .service import DefectService
from .schemas import AnalysisRunRequest, AnalysisSummary, AnalysisDetailDto
from common.schemas import BasicResponse
from .tasks import run_analysis_task
from common.redis_app import task_queue

router = APIRouter()


@router.get("/analyses/{project_key}", response_model=List[AnalysisSummary])
async def get_analysis_summaries(project_key: str, db=Depends(get_db)):
    return DefectService.get_analysis_summaries(db, project_key)


@router.get("/analyses/{analysis_id}/detail", response_model=AnalysisDetailDto)
async def get_analysis_detail(analysis_id: str, db=Depends(get_db)):
    detail = DefectService.get_analysis_detail(db, analysis_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Analysis detail not found")
    return detail


@router.post("/analyses", response_model=BasicResponse)
async def run_analysis(run_req: AnalysisRunRequest, db=Depends(get_db)):
    analysis_id = DefectService.init_analysis(
        db, run_req.project_key, run_req.analysis_type
    )

    # Do NOT pass db into the Celery task
    task_queue.enqueue(run_analysis_task, analysis_id)

    return BasicResponse(message="Analysis started successfully")


@router.get("/analyses/{analysis_id}/status", response_model=BasicResponse)
async def get_analysis_status(analysis_id: str, db=Depends(get_db)):
    status = DefectService.get_analysis_status(db, analysis_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return status.value
