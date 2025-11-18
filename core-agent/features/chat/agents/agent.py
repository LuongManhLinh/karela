from llm.dynamic_agent import GenimiDynamicAgent
from langchain.agents.middleware import LLMToolSelectorMiddleware
from langchain_core.runnables.config import RunnableConfig
from langchain_google_genai import ChatGoogleGenerativeAI
from sqlalchemy.orm import Session
from dataclasses import dataclass

from common.configs import GeminiConfig
from .prompts import RESOLVER_SYSTEM_PROMPT, RESOLVER_TOOL_SELECTOR_SYSTEM_PROMPT
from .tools import tools


tool_selector_middleware = LLMToolSelectorMiddleware(
    model=ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-lite",
        temperature=0,
        google_api_key=GeminiConfig.GEMINI_API_KEYS[-1],
        max_retries=3,
    ),
    system_prompt=RESOLVER_TOOL_SELECTOR_SYSTEM_PROMPT,
    max_tools=3,
)


agent = GenimiDynamicAgent(
    system_prompt=RESOLVER_SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_CHAT_MODEL,
    temperature=GeminiConfig.GEMINI_API_CHAT_TEMPERATURE,
    tools=tools,
    # middleware=[tool_selector_middleware],
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
    retry_delay_ms=GeminiConfig.GEMINI_API_RETRY_DELAY_MS,
)


@dataclass
class Context:
    session_id: str
    db_session: Session
    project_key: str
    story_key: str = None


def chat_with_agent(
    messages: list,
    session_id: str,
    db_session: Session,
    project_key: str,
    story_key: str = None,
) -> dict:
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
        messages,
        context=Context(
            session_id=session_id,
            db_session=db_session,
            project_key=project_key,
            story_key=story_key,
        ),
    )

    return response


def stream_with_agent(
    messages: list,
    session_id: str,
    db_session: Session,
    project_key: str,
    story_key: str = None,
):
    """Chat with the resolver agent with streaming response.

    Args:
        message (str): The user message to send to the agent.
        session_id (str): The session ID for chat history.
        project_key (str): The project key for context.
        story_key (str, optional): The story key for specific story context.

    Yields:
        str: The agent's response chunks.
    """

    for chunk, metadata in agent.stream(
        messages,
        context=Context(
            session_id=session_id,
            db_session=db_session,
            project_key=project_key,
            story_key=story_key,
        ),
        stream_mode="messages",
    ):
        yield chunk, metadata
