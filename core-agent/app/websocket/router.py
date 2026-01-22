from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio

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
                elif action == "chat_message":
                    session_id_or_key = message.get("session_id_or_key")
                    user_msg = message.get("message")
                    if session_id_or_key and user_msg:
                        # Handle chat message in background to not block
                        from app.service_factory import get_chat_service
                        from common.database import SessionLocal

                        async def process_chat():
                            db = SessionLocal()
                            try:
                                service = get_chat_service(db)
                                # We need to await the stream publishing
                                await service.publish_stream(
                                    session_id_or_key, user_msg
                                )
                            except Exception as e:
                                print(f"Error processing chat: {e}")
                            finally:
                                db.close()

                        asyncio.create_task(process_chat())

                elif action == "request_suggestion":
                    # Gherkin Suggestion
                    content = message.get("content")
                    cursor_line = message.get("cursor_line")
                    cursor_column = message.get("cursor_column")
                    ac_id = message.get("ac_id")

                    if content and ac_id:
                        from app.connection.ac.services import ACService
                        from app.connection.ac.schemas import AIRequest
                        from common.database import SessionLocal

                        async def process_suggestion():
                            db = SessionLocal()
                            try:
                                service = ACService(db)
                                request = AIRequest(
                                    ac_id=ac_id,
                                    content=content,
                                    cursor_line=cursor_line or 0,
                                    cursor_column=cursor_column or 0,
                                )
                                response = await service.get_ai_suggestions(request)

                                # Send back result string wrapped in object
                                result_payload = {
                                    "topic": f"suggestions:{ac_id}",
                                    "data": response,
                                }

                                await websocket.send_text(json.dumps(result_payload))

                            except Exception as e:
                                print(f"Error processing suggestion: {e}")
                                # Send error?
                            finally:
                                db.close()

                        asyncio.create_task(process_suggestion())

            except json.JSONDecodeError:
                print("Received invalid JSON")
            except Exception as e:
                print(f"Error processing message: {e}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
