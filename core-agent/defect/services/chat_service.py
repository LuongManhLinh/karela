from defect.chat_agents.resolver_agent import chat_with_agent
from defect.models import ChatSession, SenderRole, Message
from sqlalchemy.orm import Session
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage


_langchain_message_dict = {
    HumanMessage: SenderRole.USER,
    AIMessage: SenderRole.AI,
    ToolMessage: SenderRole.TOOL,
}


def _convert_langchain_message_to_orm(message, session_id) -> Message:
    return Message(
        role=_langchain_message_dict.get(type(message), SenderRole.USER),
        content=message.content,
        session_id=session_id,
    )


class DefectChatService:
    @staticmethod
    def chat(db: Session, session_id: str):
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            raise ValueError(f"Chat session with id '{session_id}' not found.")

        try:
            messages = []
            for msg in session.messages:
                if msg.role == SenderRole.USER:
                    messages.append(HumanMessage(content=msg.content))
                elif msg.role == SenderRole.AI:
                    messages.append(AIMessage(content=msg.content))
                elif msg.role == SenderRole.TOOL:
                    messages.append(
                        ToolMessage(content=msg.content, tool_call_id=msg.id)
                    )

            # Print messages for debugging
            print("---------------- Existing messages ----------------")
            for msg in messages:
                print(f"{type(msg).__name__}: {msg.content}")
            print("---------------- End of existing messages ----------------")

            project_key = session.project_key
            story_key = session.story_key

            response = chat_with_agent(
                messages=messages,
                session_id=session_id,
                db_session=db,
                project_key=project_key,
                story_key=story_key,
            )

            print(
                "---------------- Response messages of session: ",
                session_id,
                " ----------------",
            )
            for resp_msg in response["messages"]:
                print(resp_msg.content)
            print("---------------- End of messages ----------------")

            # response["messages"] includes old messages, so we only add the new ones
            new_messages = response["messages"][len(messages) :]
            for msg in new_messages:
                db.add(_convert_langchain_message_to_orm(msg, session_id))

        except Exception as e:
            print(f"An error occurred: {e}")
            error_message = Message(
                role=SenderRole.ERROR,
                content=f"An error occurred during chat processing: {str(e)}",
                session_id=session_id,
            )
            db.add(error_message)

        finally:
            db.commit()
