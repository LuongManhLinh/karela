from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from utils.security_utils import verify_jwt
from .manager import manager
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)

    print("Connected to client:", client_id)

    init_message = await websocket.receive_text()
    init_data = json.loads(init_message)
    token = init_data.get("token")
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
    try:
        while True:
            data = await websocket.receive_text()
            print(f"DEBUG: WebSocket received: {data}")
            try:
                message = json.loads(data)
                action = message.get("action")
                topic = message.get("topic")

                if action == "subscribe" and topic:
                    await manager.subscribe(websocket, topic)
                elif action == "unsubscribe" and topic:
                    await manager.unsubscribe(websocket, topic)
                elif action == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))

            except json.JSONDecodeError:
                print("Received invalid JSON")
            except Exception as e:
                print(f"Error processing message: {e}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
