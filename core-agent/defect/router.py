from fastapi import APIRouter, HTTPException, Depends
from typing import List

from database import get_db
from .services.data_service import DefectDataService
from .schemas import (
    AnalysisRunRequest,
    AnalysisSummary,
    AnalysisDetailDto,
    DefectSolvedUpdateRequest,
    ChatSessionCreateRequest,
    ChatSessionDto,
    ChatMessageDto,
    ChatMessageCreateRequest,
    ChatMessagesResponse,
)
from common.schemas import BasicResponse
from .tasks import analyze_all_user_stories, analyze_target_user_story, chat_with_agent
from common.redis_app import task_queue

router = APIRouter()


@router.get("/analyses/{project_key}")
async def get_analysis_summaries(project_key: str, db=Depends(get_db)):
    summaries = DefectDataService.get_analysis_summaries(db, project_key)
    import json

    print("Analysis summaries:\n", json.dumps(summaries, default=str, indent=2))
    return BasicResponse(data=summaries)


@router.get("/analyses/{analysis_id}/details")
async def get_analysis_details(analysis_id: str, db=Depends(get_db)):
    detail = DefectDataService.get_analysis_details(db, analysis_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Analysis detail not found")
    return BasicResponse(data=detail)


@router.post("/analyses")
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

    return BasicResponse(message="Analysis started successfully", data=analysis_id)


@router.get("/analyses/{analysis_id}/status")
async def get_analysis_status(analysis_id: str, db=Depends(get_db)):
    status = DefectDataService.get_analysis_status(db, analysis_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return BasicResponse(data=status)


@router.post("/defects/{defect_id}/solve")
async def mark_defect_as_solved(
    defect_id: str, body: DefectSolvedUpdateRequest, db=Depends(get_db)
):
    try:
        DefectDataService.change_defect_solved(db, defect_id, body.solved)
        return BasicResponse(message="Defect marked as solved successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


#######################################
# Chat Endpoints
########################################


@router.post("/chat")
async def create_chat_session(
    create_request: ChatSessionCreateRequest,
    db=Depends(get_db),
):
    session = DefectDataService.create_chat_session(
        db,
        project_key=create_request.project_key,
        story_key=create_request.story_key,
        role="user",
        initial_message=create_request.user_message,
    )

    task_queue.enqueue(chat_with_agent, session.id)

    return BasicResponse(
        message="Chat session created successfully",
        data=session,
    )


@router.get("/chat/projects/{project_key}/stories/{story_key}")
async def get_chat_session_by_project_and_story(
    project_key: str,
    story_key: str = None,
    db=Depends(get_db),
):
    session = DefectDataService.get_chat_session_by_project_and_story(
        db,
        project_key=project_key,
        story_key=story_key,
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return BasicResponse(data=session)


@router.get("/chat/{session_id}")
async def get_chat_session(
    session_id: str,
    db=Depends(get_db),
):
    session = DefectDataService.get_chat_session(
        db,
        session_id=session_id,
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return BasicResponse(data=session)


@router.get("/chat/{session_id}/messages/{message_id}")
async def get_latest_messages_after(
    session_id: str,
    message_id: int,
    db=Depends(get_db),
):
    messages = DefectDataService.get_latest_messages_after(
        db,
        session_id=session_id,
        message_id=message_id,
    )
    return BasicResponse(data=messages)


@router.post("/chat/{session_id}/messages")
async def post_chat_message(
    session_id: str,
    message_request: ChatMessageCreateRequest,
    db=Depends(get_db),
):
    print("Posting message to chat agent with content:", message_request.message)
    message_id, message_created_at = DefectDataService.create_chat_message(
        db,
        session_id=session_id,
        role="user",
        content=message_request.message,
    )
    task_queue.enqueue(chat_with_agent, session_id)
    return BasicResponse(
        message="Message posted successfully",
        data={
            "message_id": message_id,
            "message_created_at": message_created_at,
        },
    )


@router.post("/chat/{session_id}/proposals/{proposal_id}/accept")
async def accept_chat_proposal(
    session_id: str,
    proposal_id: int,
    db=Depends(get_db),
):
    try:
        DefectDataService.accept_proposal(
            db,
            session_id=session_id,
            proposal_id=proposal_id,
        )
        return BasicResponse(message="Proposal accepted successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/chat/{session_id}/proposals/{proposal_id}/reject")
async def reject_chat_proposal(
    session_id: str,
    proposal_id: int,
    db=Depends(get_db),
):
    try:
        DefectDataService.reject_proposal(
            db,
            session_id=session_id,
            proposal_id=proposal_id,
        )
        return BasicResponse(message="Proposal rejected successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/chat/{session_id}/proposals/{proposal_id}/revert")
async def revert_chat_proposal(
    session_id: str,
    proposal_id: int,
    db=Depends(get_db),
):
    """Revert an already applied UPDATE proposal."""
    try:
        DefectDataService.revert_applied_proposal(
            db,
            session_id=session_id,
            proposal_id=proposal_id,
        )
        return BasicResponse(message="Proposal reverted successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
