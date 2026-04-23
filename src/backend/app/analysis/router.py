from fastapi import APIRouter, HTTPException, Depends
import traceback

from app.auth_factory import get_jwt_payload
from app.service_factory import (
    get_analysis_data_service,
    get_defect_service,
)
from .services import AnalysisDataService, DefectService
from .schemas import (
    RunAnalysisRequest,
    RunAnalysisResponse,
    AnalysisDto,
    AnalysisSummary,
    AnalysisStatusesRequest,
)
from common.schemas import BasicResponse
from .tasks import run_analysis as run_analysis_task, generate_proposals

router = APIRouter()


@router.get("/")
async def list_all_analyses(
    jwt_payload=Depends(get_jwt_payload),
    service: AnalysisDataService = Depends(get_analysis_data_service),
):
    """Get all analysis summaries for a connection."""
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    summaries: list[AnalysisSummary] = service.get_analysis_summaries_by_connection(
        connection_id=conn_id,
    )
    return BasicResponse(data=summaries)


@router.get("/projects/{project_key}")
async def get_analysis_summaries_by_project(
    project_key: str,
    jwt_payload=Depends(get_jwt_payload),
    service: AnalysisDataService = Depends(get_analysis_data_service),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    summaries: list[AnalysisSummary] = service.get_analysis_summaries_by_project(
        connection_id=conn_id, project_key=project_key
    )
    return BasicResponse(data=summaries)


@router.get("/projects/{project_key}/stories/{story_key}")
async def get_analysis_summaries_by_story(
    project_key: str,
    story_key: str,
    jwt_payload=Depends(get_jwt_payload),
    service: AnalysisDataService = Depends(get_analysis_data_service),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    summaries: list[AnalysisSummary] = service.get_analysis_summaries_by_story(
        connection_id=conn_id,
        project_key=project_key,
        story_key=story_key,
    )
    return BasicResponse(data=summaries)


@router.get("/items/{analysis_id_or_key}")
async def get_analysis_details(
    analysis_id_or_key: str,
    jwt_payload=Depends(get_jwt_payload),
    service: AnalysisDataService = Depends(get_analysis_data_service),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    detail: AnalysisDto = service.get_analysis_details(
        connection_id=conn_id,
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
    analysis_id: str,
    service: AnalysisDataService = Depends(get_analysis_data_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        service.set_generating_proposals(analysis_id, True)
        generate_proposals(analysis_id=analysis_id)
        return BasicResponse()
    except ValueError as e:
        traceback.print_exc()
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/projects/{project_key}")
async def run_analysis(
    run_req: RunAnalysisRequest,
    project_key: str,
    service: AnalysisDataService = Depends(get_analysis_data_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    if run_req.analysis_type == "TARGETED" and not run_req.target_story_key:
        raise HTTPException(
            status_code=400,
            detail="target_story_key is required for TARGETED analysis",
        )
    try:
        analysis_id, analysis_key = service.init_analysis(
            connection_id=conn_id,
            project_key=project_key,
            analysis_type=run_req.analysis_type,
            story_key=run_req.target_story_key,
        )

        if run_req.analysis_type not in ["ALL", "TARGETED"]:
            raise HTTPException(status_code=400, detail="Unsupported analysis type")

        run_analysis_task(analysis_id=analysis_id)

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
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")

    analysis = service.get_raw_analysis_by_id(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    try:
        run_analysis_task(analysis_id=analysis_id)

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


@router.get("/projects/{project_key}/stories/{story_key}/defects")
async def get_defect_by_story(
    project_key: str,
    story_key: str,
    service: DefectService = Depends(get_defect_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        defects = service.get_defects_by_story_key(
            connection_id=conn_id,
            project_key=project_key,
            story_key=story_key,
        )
        return BasicResponse(data=defects)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
