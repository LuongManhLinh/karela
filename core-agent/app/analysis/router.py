from fastapi import APIRouter, HTTPException, Depends, WebSocket
from typing import List
import traceback

from app.auth_factory import get_jwt_payload
from app.service_factory import (
    get_analysis_data_service,
    get_analysis_run_service,
    get_defect_service,
)
from .services import AnalysisDataService, AnalysisRunService, DefectService
from .schemas import (
    RunAnalysisRequest,
    RunAnalysisResponse,
    AnalysisDto,
    AnalysisSummary,
    AnalysisStatusesRequest,
)
from common.schemas import BasicResponse
from .tasks import analyze_all_user_stories, analyze_target_user_story

router = APIRouter()


@router.get("/connections/{connection_name}/projects/{project_key}")
async def get_analysis_summaries_by_project(
    connection_name: str,
    project_key: str,
    jwt_payload=Depends(get_jwt_payload),
    service: AnalysisDataService = Depends(get_analysis_data_service),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    summaries: List[AnalysisSummary] = service.get_analysis_summaries_by_project(
        user_id=user_id, connection_name=connection_name, project_key=project_key
    )
    return BasicResponse(data=summaries)


@router.get("/connections/{connection_name}/projects/{project_key}/stories/{story_key}")
async def get_analysis_summaries_by_story(
    connection_name: str,
    project_key: str,
    story_key: str,
    jwt_payload=Depends(get_jwt_payload),
    service: AnalysisDataService = Depends(get_analysis_data_service),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    summaries: List[AnalysisSummary] = service.get_analysis_summaries_by_story(
        user_id=user_id,
        connection_name=connection_name,
        project_key=project_key,
        story_key=story_key,
    )
    return BasicResponse(data=summaries)


@router.get(
    "/connections/{connection_name}/projects/{project_key}/analyses/{analysis_id_or_key}"
)
async def get_analysis_details(
    connection_name: str,
    project_key: str,
    analysis_id_or_key: str,
    jwt_payload=Depends(get_jwt_payload),
    service: AnalysisDataService = Depends(get_analysis_data_service),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    detail: AnalysisDto = service.get_analysis_details(
        user_id=user_id,
        connection_name=connection_name,
        project_key=project_key,
        analysis_id_or_key=analysis_id_or_key,
    )
    if detail is None:
        raise HTTPException(status_code=404, detail="Analysis detail not found")
    return BasicResponse(data=detail)


@router.get("/{analysis_id}/defects")
async def get_defects_for_analysis(
    analysis_id: str, service: DefectService = Depends(get_defect_service)
):
    defects = service.get_defects_by_analysis_id(analysis_id)
    return BasicResponse(data=defects)


@router.post("/{analysis_id}/generate-proposals")
async def generate_proposals_for_analysis(
    analysis_id: str, service: AnalysisRunService = Depends(get_analysis_run_service)
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


@router.post("/connections/{connection_id}/projects/{project_key}")
async def run_analysis(
    run_req: RunAnalysisRequest,
    connection_id: str,
    project_key: str,
    service: AnalysisDataService = Depends(get_analysis_data_service),
):
    if run_req.analysis_type == "TARGETED" and not run_req.target_story_key:
        raise HTTPException(
            status_code=400,
            detail="target_story_key is required for TARGETED analysis",
        )
    try:
        analysis_id, analysis_key = service.init_analysis(
            connection_id,
            project_key,
            run_req.analysis_type,
            story_key=run_req.target_story_key,
        )

        if run_req.analysis_type == "ALL":
            analyze_all_user_stories(analysis_id)
        elif run_req.analysis_type == "TARGETED":
            analyze_target_user_story(analysis_id)
        else:
            raise HTTPException(status_code=400, detail="Unsupported analysis type")

        return BasicResponse(
            detail="Analysis started successfully",
            data=RunAnalysisResponse(id=analysis_id, key=analysis_key),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{analysis_id}/rerun")
async def rerun_analysis(
    analysis_id: str,
    service: AnalysisDataService = Depends(get_analysis_data_service),
):
    analysis = service.get_raw_analysis_by_id(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    try:
        if analysis.type.value == "ALL":
            analyze_all_user_stories(analysis_id)
        elif analysis.type.value == "TARGETED":
            analyze_target_user_story(analysis_id)
        else:
            raise HTTPException(
                status_code=400, detail=f"Unsupported analysis type {analysis.type}"
            )

        return BasicResponse(detail="Analysis started successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{analysis_id}/status")
async def get_analysis_status(
    analysis_id: str, service: AnalysisDataService = Depends(get_analysis_data_service)
):
    status = service.get_analysis_status(analysis_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return BasicResponse(data=status)


@router.post("/statuses")
async def get_analyses_statuses(
    request: AnalysisStatusesRequest,
    service: AnalysisDataService = Depends(get_analysis_data_service),
):
    analysis_ids = request.analysis_ids
    if analysis_ids:
        statuses = service.get_analyses_statuses(analysis_ids)
        return BasicResponse(data=statuses)
    return BasicResponse(data=[])


@router.post("/defects/{defect_id}/solve/{flag}")
async def mark_defect_as_solved(
    defect_id: str, flag: int, service: DefectService = Depends(get_defect_service)
):
    try:
        service.change_defect_solved(defect_id, flag == 1)
        return BasicResponse(detail="Defect marked as solved successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
