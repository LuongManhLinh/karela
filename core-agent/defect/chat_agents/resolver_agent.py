from llm.dynamic_agent import GenimiDynamicAgent
from sqlalchemy.orm import Session

from config import LLMConfig
from .chat_history import get_session_history_from_config
from .prompts import RESOLVER_SYSTEM_PROMPT
from .resolver_tools import tools

agent = GenimiDynamicAgent(
    system_prompt=RESOLVER_SYSTEM_PROMPT,
    model_name=LLMConfig.GEMINI_API_CHAT_MODEL,
    temperature=LLMConfig.GEMINI_API_CHAT_TEMPERATURE,
    tools=tools,
    session_history_provider=get_session_history_from_config,
    api_keys=LLMConfig.GEMINI_API_KEYS,
    max_retries=LLMConfig.GEMINI_API_MAX_RETRY,
    retry_delay_ms=LLMConfig.GEMINI_API_RETRY_DELAY_MS,
)


def chat(
    message: str,
    session_id: str,
    db_session: Session,
    project_key: str,
    story_key: str = None,
) -> str:
    """Chat with the resolver agent.

    Args:
        message (str): The user message to send to the agent.
        session_id (str): The session ID for chat history.
        project_key (str): The project key for context.
        story_key (str, optional): The story key for specific story context.

    Returns:
        str: The agent's response.
    """
    response = agent.invoke(
        user_message=message,
        config={
            "configurable": {
                "db_session": db_session,
                "session_id": session_id,
                "project_key": project_key,
                "story_key": story_key,
            }
        },
    )
    return response
