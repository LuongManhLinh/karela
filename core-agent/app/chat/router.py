import asyncio
from fastapi import APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi import Depends, HTTPException
from typing import List
import json

from app.auth_factory import get_jwt_payload
from app.service_factory import (
    get_chat_data_service,
    get_chat_service,
)
from .services import ChatDataService, ChatService
from .schemas import (
    ChatSessionSummary,
)
from common.schemas import BasicResponse
from utils.security_utils import verify_jwt

router = APIRouter()


@router.websocket("/")
async def websocket_chat(
    websocket: WebSocket,
    chat_service: ChatService = Depends(get_chat_service),
    data_service: ChatDataService = Depends(get_chat_data_service),
):
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

        if not session_id:
            # Create new chat session
            session_id = data_service.create_chat_session(
                connection_id=connection_id,
                project_key=project_key,
                story_key=story_key,
            )
        print(f"WS connected: session_id={session_id}")

        # Always send session ID back
        await websocket.send_json({"type": "session_id", "data": session_id})

        print(f"Received message: {user_message}")

        async for chunk_dict in chat_service.stream(
            session_id=session_id, user_message=user_message
        ):
            print(f"Sending chunk: {chunk_dict['data']}")
            await websocket.send_json(chunk_dict)
            await asyncio.sleep(0.1)  # Yield to event loop

    except WebSocketDisconnect:
        print("WS disconnected")

    finally:
        await websocket.close()
        if session_id:
            chat_service.persist_messages(session_id=session_id)


@router.get("/")
async def list_chat_sessions(
    connection_id: str,
    jwt_payload=Depends(get_jwt_payload),
    service: ChatDataService = Depends(get_chat_data_service),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    sessions: List[ChatSessionSummary] = service.list_chat_sessions(
        connection_id=connection_id
    )
    return BasicResponse(data=sessions)


@router.get("/{session_id}")
async def get_session_detail(
    session_id: str,
    service: ChatDataService = Depends(get_chat_data_service),
):
    dto = service.get_chat_session(session_id=session_id)
    for message in dto.messages:
        print(f"Message: {message.role} - {message.content[:30]}...")
    return BasicResponse(data=dto)
