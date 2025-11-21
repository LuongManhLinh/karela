from fastapi import APIRouter, HTTPException, Depends
from typing import List

from common.database import get_db
from .services import DefectDataService
from .schemas import AnalysisRunRequest, AnalysisDetailDto, AnalysisSummary
from common.schemas import BasicResponse
from .tasks import analyze_all_user_stories, analyze_target_user_story
from common.redis_app import task_queue

router = APIRouter()


@router.get("/analyses/connections/{connection_id}")
async def get_analysis_summaries(connection_id: str, db=Depends(get_db)):
    summaries: List[AnalysisSummary] = DefectDataService.get_analysis_summaries(
        db, connection_id
    )
    return BasicResponse(data=summaries)


@router.get("/analyses/{analysis_id}/details")
async def get_analysis_details(analysis_id: str, db=Depends(get_db)):
    detail: AnalysisDetailDto = DefectDataService.get_analysis_details(db, analysis_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Analysis detail not found")
    return BasicResponse(data=detail)


@router.post("/analyses/connections/{connection_id}/{project_key}")
async def run_analysis(
    run_req: AnalysisRunRequest,
    connection_id: str,
    project_key: str,
    db=Depends(get_db),
):
    analysis_id = DefectDataService.init_analysis(
        db, connection_id, project_key, run_req.analysis_type
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

    return BasicResponse(detail="Analysis started successfully", data=analysis_id)


@router.get("/analyses/{analysis_id}/status")
async def get_analysis_status(analysis_id: str, db=Depends(get_db)):
    status = DefectDataService.get_analysis_status(db, analysis_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return BasicResponse(data=status)


@router.post("/{defect_id}/solve/{flag}")
async def mark_defect_as_solved(defect_id: str, flag: int, db=Depends(get_db)):
    try:
        DefectDataService.change_defect_solved(db, defect_id, flag == 1)
        return BasicResponse(detail="Defect marked as solved successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
