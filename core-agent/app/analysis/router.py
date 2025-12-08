from fastapi import APIRouter, HTTPException, Depends, WebSocket
from typing import List
import traceback

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
from common.redis_app import task_queue

router = APIRouter()


@router.get("/connections/{connection_id}")
async def get_analysis_summaries(
    connection_id: str,
    service: AnalysisDataService = Depends(get_analysis_data_service),
):
    summaries: List[AnalysisSummary] = service.get_analysis_summaries(connection_id)
    return BasicResponse(data=summaries)


@router.get("/{analysis_id}")
async def get_analysis_details(
    analysis_id: str, service: AnalysisDataService = Depends(get_analysis_data_service)
):
    detail: AnalysisDto = service.get_analysis_details(analysis_id)
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


@router.post("/connections/{connection_id}/{project_key}")
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
            task_queue.enqueue(analyze_all_user_stories, analysis_id)
        elif run_req.analysis_type == "TARGETED":
            task_queue.enqueue(analyze_target_user_story, analysis_id)
        else:
            raise HTTPException(status_code=400, detail="Unsupported analysis type")

        return BasicResponse(
            detail="Analysis started successfully",
            data=RunAnalysisResponse(id=analysis_id, key=analysis_key),
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.websocket("/")
async def run_analysis_ws(
    websocket: WebSocket,
    service: AnalysisRunService = Depends(get_analysis_run_service),
):
    await websocket.accept()
    print("WS connection accepted")

    raw_request = await websocket.receive_json()
    connection_id = raw_request.get("connection_id")
    if not connection_id:
        await websocket.close(code=4002, reason="Connection ID missing")
        return
    project_key = raw_request.get("project_key")
    if not project_key:
        await websocket.close(code=4003, reason="Project key missing")
        return
    analysis_type = raw_request.get("analysis_type")
    if analysis_type not in ["TARGETED", "ALL"]:
        await websocket.close(code=4000, reason="Unsupported analysis type")
        return
    if analysis_type == "ALL":
        async for chunk in service.stream_all_user_stories_analysis(
            connection_id, project_key, analysis_type
        ):
            await websocket.send_json(chunk)
    else:
        story_key = raw_request.get("target_story_key")
        if not story_key:
            await websocket.close(
                code=4001,
                reason="target_story_key is required for TARGETED analysis",
            )
            return
        async for chunk in service.stream_target_user_story_analysis(
            connection_id, project_key, analysis_type, story_key
        ):
            await websocket.send_json(chunk)

    await websocket.close()

    # try:
    #     while True:
    #         await websocket.receive_text()  # keep WS alive
    # except WebSocketDisconnect:
    #     print("Client gone, but task continues")
    # finally:
    #     await websocket.close()


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
            task_queue.enqueue(analyze_all_user_stories, analysis_id)
        elif analysis.type.value == "TARGETED":
            task_queue.enqueue(analyze_target_user_story, analysis_id)
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
