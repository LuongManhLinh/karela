from fastapi import APIRouter, HTTPException, Depends
from typing import List

from database import get_db
from .services import DefectRunService, DefectDataService
from .schemas import (
    AnalysisRunRequest,
    AnalysisSummary,
    AnalysisDetailDto,
    DefectSolvedUpdateRequest,
)
from common.schemas import BasicResponse
from .tasks import analyze_all_user_stories, analyze_target_user_story
from common.redis_app import task_queue

router = APIRouter()


@router.get("/analyses/{project_key}", response_model=List[AnalysisSummary])
async def get_analysis_summaries(project_key: str, db=Depends(get_db)):
    return DefectDataService.get_analysis_summaries(db, project_key)


@router.get("/analyses/{analysis_id}/detail", response_model=AnalysisDetailDto)
async def get_analysis_detail(analysis_id: str, db=Depends(get_db)):
    detail = DefectDataService.get_analysis_detail(db, analysis_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Analysis detail not found")
    return detail


@router.post("/analyses", response_model=BasicResponse)
async def run_analysis(run_req: AnalysisRunRequest, db=Depends(get_db)):
    analysis_id = DefectDataService.init_analysis(
        db, run_req.project_key, run_req.analysis_type
    )

    if run_req.analysis_type == "ALL":
        task_queue.enqueue(analyze_all_user_stories, analysis_id)
    elif run_req.analysis_type == "TARGETED":
        if not run_req.target_story_key:
            raise HTTPException(
                status_code=400,
                detail="target_story_key is required for TARGETED analysis",
            )
        task_queue.enqueue(
            analyze_target_user_story, analysis_id, run_req.target_story_key
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported analysis type")

    return BasicResponse(message="Analysis started successfully")


@router.get("/analyses/{analysis_id}/status", response_model=BasicResponse)
async def get_analysis_status(analysis_id: str, db=Depends(get_db)):
    status = DefectRunService.get_analysis_status(db, analysis_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return status.value


@router.post("/defects/{defect_id}/solve", response_model=BasicResponse)
async def mark_defect_as_solved(
    defect_id: str, body: DefectSolvedUpdateRequest, db=Depends(get_db)
):
    try:
        DefectDataService.change_defect_solved(db, defect_id, body.solved)
        return BasicResponse(message="Defect marked as solved successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
