from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi import Depends, HTTPException
from typing import List
import json
import asyncio

from common.fastapi_router import get_jwt_payload
from common.database import get_db
from .services import ChatDataService, ChatService
from .schemas import (
    ChatProposalDto,
    ChatSessionDto,
    ChatSessionSummary,
)
from common.schemas import BasicResponse
from utils.security_utils import verify_jwt

router = APIRouter()


@router.websocket("/")
async def websocket_chat(websocket: WebSocket):
    await websocket.accept()

    try:
        # First message MUST contain user auth + optional session
        raw = await websocket.receive_text()
        init = json.loads(raw)
        print(f"WS init: {json.dumps(init, indent=2)}")

        token = init.get("token")
        if not token:
            await websocket.close(code=4401, reason="Token missing")
            return

        # Validate JWT manually
        try:
            payload = verify_jwt(token)
        except Exception as e:
            await websocket.close(code=4401, reason=str(e))
            return

        user_id: str = payload.get("sub")
        if not user_id:
            await websocket.close(code=4401, reason="Malformed token")
            return

        connection_id = init.get("connection_id")
        if not connection_id:
            await websocket.close(code=4401, reason="Connection ID missing")
            return

        project_key = init.get("project_key")
        if not project_key:
            await websocket.close(code=4401, reason="Project key missing")
            return

        user_message = init.get("user_message")
        if not user_message:
            await websocket.close(code=4401, reason="Message missing")
            return

        story_key = init.get("story_key")

        session_id = init.get("session_id")

        db = next(get_db())

        if not session_id:
            # Create new chat session
            session_id = ChatDataService.create_chat_session(
                db=db,
                user_id=user_id,
                connection_id=connection_id,
                project_key=project_key,
                story_key=story_key,
            )
        print(f"WS connected: user_id={user_id}, session_id={session_id}")

        # Always send session ID back
        await websocket.send_json({"type": "session_id", "data": session_id})

        print(f"Received message: {user_message}")

        async for chunk_dict in ChatService.stream(
            db=db, session_id=session_id, user_message=user_message
        ):
            print(f"Sending chunk: {chunk_dict['data']}")
            await asyncio.sleep(0.5)
            await websocket.send_json(chunk_dict)

    except WebSocketDisconnect:
        print("WS disconnected")

    finally:
        await websocket.close()
        if db and session_id:
            ChatService.persist_messages(db=db, session_id=session_id)


@router.get("/")
async def list_chat_sessions(
    connection_id: str, db=Depends(get_db), jwt_payload=Depends(get_jwt_payload)
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    sessions: List[ChatSessionSummary] = ChatDataService.list_chat_sessions(
        db, user_id, connection_id=connection_id
    )
    return BasicResponse(data=sessions)


@router.get("/{session_id}")
async def get_chat_session(
    session_id: str,
    db=Depends(get_db),
):
    session: ChatSessionDto = ChatDataService.get_chat_session(
        db,
        session_id=session_id,
    )
    if session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return BasicResponse(data=session)


@router.get("/{session_id}/proposals/{proposal_id}")
async def get_chat_proposal(
    session_id: str,
    proposal_id: int,
    db=Depends(get_db),
):
    proposal: ChatProposalDto = ChatDataService.get_proposal(
        db,
        session_id=session_id,
        proposal_id=proposal_id,
    )
    if proposal is None:
        raise HTTPException(status_code=404, detail="Chat proposal not found")
    return BasicResponse(data=proposal)


@router.post("/{session_id}/proposals/{proposal_id}/accept")
async def accept_chat_proposal(
    session_id: str,
    proposal_id: int,
    db=Depends(get_db),
):
    try:
        ChatDataService.accept_proposal(
            db,
            session_id=session_id,
            proposal_id=proposal_id,
        )
        return BasicResponse(detail="Proposal accepted successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{session_id}/proposals/{proposal_id}/reject")
async def reject_chat_proposal(
    session_id: str,
    proposal_id: int,
    db=Depends(get_db),
):
    try:
        ChatDataService.reject_proposal(
            db,
            session_id=session_id,
            proposal_id=proposal_id,
        )
        return BasicResponse(detail="Proposal rejected successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{session_id}/proposals/{proposal_id}/revert")
async def revert_chat_proposal(
    session_id: str,
    proposal_id: int,
    db=Depends(get_db),
):
    """Revert an already applied UPDATE proposal."""
    try:
        ChatDataService.revert_applied_proposal(
            db,
            session_id=session_id,
            proposal_id=proposal_id,
        )
        return BasicResponse(detail="Proposal reverted successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
