from sqlalchemy.orm import Session
from langchain_core.messages import (
    AIMessage,
    HumanMessage,
    ToolMessage,
    AIMessageChunk,
    ToolCall,
)

from app.documentation.services import DocumentationService
from app.preference.services import PreferenceService
from app.connection.jira.services import JiraService

from ..agents.agent import stream_with_agent, generate_chat_title

from ..models import (
    ChatSession,
    SenderRole,
    Message,
)
from ..schemas import MessageChunk
from common.database import uuid_generator
from common.redis_app import redis_client
from sqlalchemy.orm import Session


from datetime import datetime
import inspect
import json
import traceback


class ChatService:
    def __init__(self, db: Session):
        self.db = db
        self.doc_service = DocumentationService(db=db)
        self.preference_service = PreferenceService(db=db)
        self.jira_service = JiraService(db=db)
        self.redis_client = redis_client

    async def publish_stream(self, session_id_or_key: str, user_message: str):
        """Streams chat response chunks to Redis Pub/Sub."""
        topic = f"chat:{session_id_or_key}"
        print(f"Starting publish stream to {topic}")

        async for chunk_dict in self.stream(session_id_or_key, user_message):
            # chunk_dict is {"type": ..., "data": ...}
            payload = json.dumps(chunk_dict)
            publish_result = self.redis_client.publish(topic, payload)
            if inspect.isawaitable(publish_result):
                await publish_result

    async def stream(self, session_id_or_key: str, user_message: str):
        session = (
            self.db.query(ChatSession)
            .filter(
                (ChatSession.id == session_id_or_key)
                | (ChatSession.key == session_id_or_key)
            )
            .first()
        )
        if not session:
            raise ValueError(f"Chat session with id '{session_id_or_key}' not found.")

        cache = {}

        try:
            messages = (
                self.db.query(Message)
                .filter(Message.session_id == session.id)
                .order_by(Message.created_at)
                .all()
            )
            history_messages = []
            for msg in messages:
                if msg.role == SenderRole.USER:
                    history_messages.append(HumanMessage(content=msg.content))
                elif msg.role == SenderRole.AGENT:
                    history_messages.append(AIMessage(content=msg.content))
                elif msg.role == SenderRole.TOOL:
                    history_messages.append(
                        ToolMessage(content=msg.content, tool_call_id=msg.tool_call_id)
                    )
                    print("Tool message created at", msg.created_at)
                elif msg.role == SenderRole.AGENT_FUNCTION_CALL:
                    content_dict = json.loads(msg.content)
                    history_messages.append(
                        AIMessageChunk(
                            id=msg.id,
                            content="",
                            tool_calls=[
                                ToolCall(
                                    name=content_dict.get(
                                        "function_name", "UNKNOWN_FUNCTION"
                                    ),
                                    args=content_dict.get("arguments", {}),
                                    id=msg.tool_call_id or msg.id,
                                )
                            ],
                        )
                    )
                    print("Agent function call message created at", msg.created_at)
            print(
                f"Loaded {len(history_messages)} history messages for session {session.key}"
            )

            if not history_messages:
                title = generate_chat_title(user_message)
                # title = "New Chat"
                print(f"Generated title for session {session.key}: {title}")
                session.title = title
                self.db.commit()

                yield {"type": "title", "data": title}

            new_message = Message(
                role=SenderRole.USER,
                content=user_message,
                session_id=session.id,
                created_at=datetime.now(),
            )

            self.db.add(new_message)
            self.db.commit()

            history_messages.append(HumanMessage(content=user_message))
            connection_id = session.connection_id
            project_key = session.project_key

            preference = self.preference_service.get_chat_preference(
                connection_id=connection_id, project_key=project_key
            )

            project_desc = self.jira_service.get_project_description(
                connection_id=connection_id, project_key=project_key
            )

            for chunk, _ in stream_with_agent(
                messages=history_messages,
                session_id=session.id,
                connection_id=connection_id,
                db=self.db,
                project_key=project_key,
                extra_instruction=preference.chat_guidelines if preference else None,
                project_description=project_desc,
            ):
                msg_chunk = MessageChunk(
                    id=chunk.id,
                )

                yield_after_tool = None
                tool_call_id = None

                if isinstance(chunk, AIMessageChunk):
                    fn_call = chunk.additional_kwargs.get("function_call")
                    if not fn_call:
                        tool_calls = chunk.tool_calls
                        if tool_calls:
                            fn_call = tool_calls[0]
                    if fn_call:
                        if not fn_call.get("id"):
                            print("Dummy chunk for the function call, skipping...")
                            continue
                        tool_call_id = fn_call["id"]
                        print(
                            "Function call detected in chunk: ",
                            fn_call,
                            "at",
                            datetime.now(),
                        )
                        msg_chunk.role = "agent_function_call"
                        # fn_name = fn_call.get("name", "UNKNOWN_FUNCTION")
                        print("Function call content: ", fn_call)
                        fn_name = fn_call.get("name", "UNKNOWN_FUNCTION")
                        arg_dict = fn_call.get("arguments", {})
                        if not arg_dict:
                            arg_dict = fn_call.get("args", {})
                        if isinstance(arg_dict, str):
                            try:
                                arg_dict = json.loads(arg_dict)
                            except:
                                arg_dict = {}
                        msg_chunk.content = json.dumps(
                            {
                                "function_name": fn_name,
                                "arguments": arg_dict,
                            },
                            indent=2,
                        )

                    else:
                        msg_chunk.role = "agent"
                        content = chunk.content
                        if isinstance(content, str):
                            msg_chunk.content = content
                        elif isinstance(content, list):
                            contents = []
                            for c in content:
                                if isinstance(c, str):
                                    contents.append(c)
                                elif isinstance(c, dict):
                                    contents.append(c.get("text", str(c)))
                                else:
                                    contents.append(str(c))
                            msg_chunk.content = "".join(contents)
                else:
                    print("Tool output detected in chunk at", datetime.now())
                    chunk: ToolMessage = chunk
                    msg_chunk.role = "tool"
                    msg_chunk.content = chunk.content
                    tool_call_id = chunk.tool_call_id
                    yield_after_tool = ChatService._additional_from_tool_msg(chunk)

                yield {"type": "message", "data": msg_chunk.model_dump()}

                if yield_after_tool:
                    data = yield_after_tool[1]
                    if isinstance(data, MessageChunk):
                        data = data.model_dump()
                    yield {"type": yield_after_tool[0], "data": data}

                stored_chunk = cache.get(msg_chunk.id)
                if stored_chunk:
                    stored_chunk["data"].content += msg_chunk.content
                else:
                    print(
                        f"Caching new chunk with id {msg_chunk.id} and role {msg_chunk.role} at {datetime.now()}"
                    )
                    cache[msg_chunk.id] = {
                        "data": msg_chunk,
                        "created_at": datetime.now(),
                        "tool_call_id": tool_call_id,
                    }

                if yield_after_tool and yield_after_tool[0] == "message":
                    data = yield_after_tool[1]
                    cache[data.id] = {
                        "data": data,
                        "created_at": datetime.now(),
                    }

            yield {"type": "stream_end"}
        except Exception as e:
            print(f"An error occurred: {e}")
            traceback.print_exc()
            err_id = uuid_generator()
            err_chunk = MessageChunk(
                id=err_id,
                content=f"An error occurred during chat processing: {str(e)}",
                role="error",
            )
            yield {"type": "message", "data": err_chunk.model_dump()}
            cache[err_id] = {
                "data": err_chunk,
                "created_at": datetime.now(),
            }

        finally:
            msg_to_save = list(cache.values())
            msg_to_save = sorted(msg_to_save, key=lambda x: x["created_at"])
            self._persist_messages(session, msg_to_save)

    @staticmethod
    def _additional_from_tool_msg(tool_msg: ToolMessage):
        try:
            match tool_msg.name:
                case "update_stories" | "create_stories":
                    payload = json.loads(tool_msg.content)
                    return "proposal", payload["proposal_keys"]
                case "run_defect_analysis":
                    payload = json.loads(tool_msg.content)
                    return "message", MessageChunk(
                        id=tool_msg.tool_call_id,
                        role="analysis_progress",
                        content=payload["analysis_id"],
                    )
                case _:
                    return None

        except Exception as e:
            print(f"Error processing tool message: {e}")
            print("While processing tool message:", tool_msg)
            traceback.print_exc()
            return None

    def _persist_messages(self, session: Session, messages: list[dict]):
        print(f"Persisting {len(messages)} messages...")
        try:
            for msg in messages:
                msg_chunk: MessageChunk = msg["data"]
                orm_message = Message(
                    id=msg_chunk.id,
                    content=msg_chunk.content,
                    session_id=session.id,
                    created_at=msg["created_at"],
                )
                if msg_chunk.role == "agent":
                    orm_message.role = SenderRole.AGENT
                elif msg_chunk.role == "agent_function_call":
                    orm_message.role = SenderRole.AGENT_FUNCTION_CALL
                    orm_message.tool_call_id = msg.get("tool_call_id")
                elif msg_chunk.role == "tool":
                    orm_message.role = SenderRole.TOOL
                    orm_message.tool_call_id = msg.get("tool_call_id")
                elif msg_chunk.role == "analysis_progress":
                    orm_message.role = SenderRole.ANALYSIS_PROGRESS

                else:  # Default to error
                    orm_message.role = SenderRole.ERROR

                self.db.add(orm_message)

        finally:
            self.db.commit()
