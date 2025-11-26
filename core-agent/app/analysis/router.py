from fastapi import APIRouter, HTTPException, Depends
from typing import List
import traceback

from app.service_factory import get_defect_data_service, get_defect_run_service
from .services import DefectDataService, DefectRunService
from .schemas import AnalysisRunRequest, AnalysisDetailDto, AnalysisSummary
from common.schemas import BasicResponse
from .tasks import analyze_all_user_stories, analyze_target_user_story
from common.redis_app import task_queue

router = APIRouter()


@router.get("/connections/{connection_id}")
async def get_analysis_summaries(
    connection_id: str, service: DefectDataService = Depends(get_defect_data_service)
):
    summaries: List[AnalysisSummary] = service.get_analysis_summaries(connection_id)
    return BasicResponse(data=summaries)


@router.get("/{analysis_id}")
async def get_analysis_details(
    analysis_id: str, service: DefectDataService = Depends(get_defect_data_service)
):
    detail: AnalysisDetailDto = service.get_analysis_details(analysis_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Analysis detail not found")
    return BasicResponse(data=detail)


@router.post("/{analysis_id}/generate-proposals")
async def generate_proposals_for_analysis(
    analysis_id: str, service: DefectRunService = Depends(get_defect_run_service)
):
    try:
        print("Generating proposals for analysis:", analysis_id)
        proposal_ids = service.generate_proposals(analysis_id)
        return BasicResponse(
            detail="Proposal generation started successfully", data=proposal_ids
        )
    except ValueError as e:
        traceback.print_exc()
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/connections/{connection_id}/{project_key}")
async def run_analysis(
    run_req: AnalysisRunRequest,
    connection_id: str,
    project_key: str,
    service: DefectDataService = Depends(get_defect_data_service),
):
    analysis_id = service.init_analysis(
        connection_id,
        project_key,
        run_req.analysis_type,
        story_key=run_req.target_story_key,
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


@router.get("/{analysis_id}/status")
async def get_analysis_status(
    analysis_id: str, service: DefectDataService = Depends(get_defect_data_service)
):
    status = service.get_analysis_status(analysis_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return BasicResponse(data=status)


@router.post("/defects/{defect_id}/solve/{flag}")
async def mark_defect_as_solved(
    defect_id: str,
    flag: int,
    service: DefectDataService = Depends(get_defect_data_service),
):
    try:
        service.change_defect_solved(defect_id, flag == 1)
        return BasicResponse(detail="Defect marked as solved successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
