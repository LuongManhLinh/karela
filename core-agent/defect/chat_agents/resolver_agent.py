from llm.dynamic_agent import GenimiDynamicAgent
from langchain.agents.middleware import LLMToolSelectorMiddleware
from langchain_core.runnables.config import RunnableConfig
from langchain_google_genai import ChatGoogleGenerativeAI
from sqlalchemy.orm import Session

from config import LLMConfig
from .chat_history import get_session_history_from_config
from .prompts import RESOLVER_SYSTEM_PROMPT, RESOLVER_TOOL_SELECTOR_SYSTEM_PROMPT
from .resolver_tools import tools


tool_selector_middleware = LLMToolSelectorMiddleware(
    model=ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-lite",
        temperature=0,
        google_api_key=LLMConfig.GEMINI_API_KEYS[-1],
        max_retries=3,
    ),
    system_prompt=RESOLVER_TOOL_SELECTOR_SYSTEM_PROMPT,
    max_tools=3,
)


agent = GenimiDynamicAgent(
    system_prompt=RESOLVER_SYSTEM_PROMPT,
    model_name=LLMConfig.GEMINI_API_CHAT_MODEL,
    temperature=LLMConfig.GEMINI_API_CHAT_TEMPERATURE,
    tools=tools,
    # middleware=[tool_selector_middleware],
    session_history_provider=get_session_history_from_config,
    api_keys=LLMConfig.GEMINI_API_KEYS,
    max_retries=LLMConfig.GEMINI_API_MAX_RETRY,
    retry_delay_ms=LLMConfig.GEMINI_API_RETRY_DELAY_MS,
)


def chat_with_agent(
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
        config=RunnableConfig(
            configurable={
                "session_id": session_id,
                "db_session": db_session,
                "project_key": project_key,
                "story_key": story_key,
            }
        ),
    )

    return response
