from sqlalchemy.orm import Session
from langchain_core.messages import (
    AIMessage,
    HumanMessage,
    ToolMessage,
    AIMessageChunk,
)

from ..agents.agent import chat_with_agent, stream_with_agent

from ..models import (
    ChatSession,
    SenderRole,
    Message,
)
from ..schemas import MessageChunk
from common.database import uuid_generator
from .sesison_cache import SESSION_CACHE


from sqlalchemy.orm import Session


from typing import List, Optional, Iterator
from datetime import datetime
import json
import traceback


_langchain_message_dict = {
    HumanMessage: SenderRole.USER,
    AIMessage: SenderRole.AGENT,
    ToolMessage: SenderRole.TOOL,
}


def _convert_langchain_message_to_orm(message, session_id) -> Message:
    return Message(
        role=_langchain_message_dict.get(type(message), SenderRole.USER),
        content=message.content,
        session_id=session_id,
    )


class ChatService:
    def __init__(self, db: Session):
        self.db = db

    async def stream(self, session_id: str, user_message: str):
        session = (
            self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
        )
        if not session:
            raise ValueError(f"Chat session with id '{session_id}' not found.")

        new_message = Message(
            role=SenderRole.USER,
            content=user_message,
            session_id=session_id,
            created_at=datetime.now(),
        )

        self.db.add(new_message)
        self.db.commit()

        cache = {}

        try:
            print("Preparing history messages for agent...")
            history_messages = []
            for msg in session.messages:
                if msg.role == SenderRole.USER:
                    history_messages.append(HumanMessage(content=msg.content))
                elif msg.role == SenderRole.AGENT:
                    history_messages.append(AIMessage(content=msg.content))
                elif msg.role == SenderRole.TOOL:
                    history_messages.append(
                        ToolMessage(content=msg.content, tool_call_id=msg.id)
                    )
            history_messages.append(HumanMessage(content=user_message))
            project_key = session.project_key
            story_key = session.story_key
            print("Starting streaming response from agent...")
            for chunk, _ in stream_with_agent(
                messages=history_messages,
                session_id=session_id,
                connection_id=session.connection_id,
                db_session=self.db,
                project_key=project_key,
                story_key=story_key,
            ):
                msg_chunk = MessageChunk(
                    id=chunk.id,
                )

                yield_after = None

                if isinstance(chunk, AIMessageChunk):
                    fn_call = chunk.additional_kwargs.get("function_call")
                    if fn_call:
                        msg_chunk.role = "agent_function_call"
                        msg_chunk.content = fn_call.get("name")
                    else:
                        msg_chunk.role = "agent"
                        msg_chunk.content = chunk.content
                else:
                    msg_chunk.role = "tool"
                    msg_chunk.content = chunk.content
                    yield_after = ChatService._additional_from_tool_msg(chunk)

                yield {"type": "message", "data": msg_chunk.model_dump_json()}

                if yield_after:
                    data = yield_after[1]
                    if isinstance(data, MessageChunk):
                        data = data.model_dump_json()
                    print(
                        f"Yielding additional data of type {yield_after[0]}, content: {data}"
                    )
                    yield {"type": yield_after[0], "data": data}

                stored_chunk = cache.get(msg_chunk.id)
                if stored_chunk:
                    stored_chunk["data"].content += msg_chunk.content
                else:
                    cache[msg_chunk.id] = {
                        "data": msg_chunk,
                        "created_at": datetime.now(),
                    }

                if yield_after and yield_after[0] == "message":
                    data = yield_after[1]
                    cache[data.id] = {
                        "data": data,
                        "created_at": datetime.now(),
                    }

        except Exception as e:
            print(f"An error occurred: {e}")
            traceback.print_exc()
            err_id = uuid_generator()
            err_chunk = MessageChunk(
                id=err_id,
                content=f"An error occurred during chat processing: {str(e)}",
                role="error",
            )
            yield {"type": "message", "data": err_chunk.model_dump_json()}
            cache[err_id] = {
                "data": err_chunk,
                "created_at": datetime.now(),
            }

        finally:
            SESSION_CACHE[session_id] = cache

    @staticmethod
    def _additional_from_tool_msg(tool_msg: ToolMessage):
        try:
            match tool_msg.name:
                case "propose_creating_stories" | "propose_modifying_stories":
                    payload = json.loads(tool_msg.content)
                    return "proposal", payload["propose_id"]
                case "show_analysis_progress_in_chat":
                    payload = json.loads(tool_msg.content)
                    return "message", MessageChunk(
                        id=tool_msg.tool_call_id,
                        role="analysis_progress",
                        content=payload["analysis_id"],
                    )
                case _:
                    return None

        except:
            return None

    def persist_messages(self, session_id: str):
        print("Persisting messages from cache to database...")
        cache = SESSION_CACHE.get(session_id)
        if not cache:
            print("No cached messages found.")
            return

        session = (
            self.db.query(ChatSession).filter(ChatSession.id == session_id).first()
        )
        if not session:
            raise ValueError(f"Chat session with id '{session_id}' not found.")

        print(f"Persisting {len(cache)} messages...")
        try:
            for item in cache.values():
                msg_chunk: MessageChunk = item["data"]
                orm_message = Message(
                    id=msg_chunk.id,
                    content=msg_chunk.content,
                    session_id=session_id,
                    created_at=item["created_at"],
                )
                if msg_chunk.role == "agent":
                    orm_message.role = SenderRole.AGENT
                elif msg_chunk.role == "agent_function_call":
                    orm_message.role = SenderRole.AGENT_FUNCTION_CALL
                elif msg_chunk.role == "tool":
                    orm_message.role = SenderRole.TOOL
                elif msg_chunk.role == "analysis_progress":
                    orm_message.role = SenderRole.ANALYSIS_PROGRESS
                else:  # Default to error
                    orm_message.role = SenderRole.ERROR

                self.db.add(orm_message)

        finally:
            self.db.commit()
            del SESSION_CACHE[session_id]
