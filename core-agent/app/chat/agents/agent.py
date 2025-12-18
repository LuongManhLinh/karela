from llm.dynamic_agent import GenimiDynamicAgent
from langchain.agents.middleware import LLMToolSelectorMiddleware
from langchain.agents.middleware import dynamic_prompt, ModelRequest

from sqlalchemy.orm import Session
from dataclasses import dataclass

from common.configs import GeminiConfig
from app.chat.services import ChatDataService
from app.proposal.services import ProposalService
from app.analysis.services import AnalysisDataService, DefectService
from .prompts import SYSTEM_PROMPT
from .tools import tools


# tool_selector_middleware = LLMToolSelectorMiddleware(
#     model=ChatGoogleGenerativeAI(
#         model="gemini-2.0-flash-lite",
#         temperature=0,
#         google_api_key=GeminiConfig.GEMINI_API_KEYS[-1],
#         max_retries=3,
#     ),
#     system_prompt=RESOLVER_TOOL_SELECTOR_SYSTEM_PROMPT,
#     max_tools=3,
# )


@dynamic_prompt
def user_context_prompt(request: ModelRequest) -> str:
    """Generate system prompt based on user role."""
    project_key = request.runtime.context.project_key
    story_key = request.runtime.context.story_key
    return SYSTEM_PROMPT.format(
        context=f"Project Key: {project_key}\nStory Key: {story_key or 'N/A'}"
    )


agent = GenimiDynamicAgent(
    system_prompt=SYSTEM_PROMPT,
    model_name=GeminiConfig.GEMINI_API_CHAT_MODEL,
    temperature=GeminiConfig.GEMINI_API_CHAT_TEMPERATURE,
    tools=tools,
    middleware=[user_context_prompt],
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
)


@dataclass
class Context:
    session_id: str
    connection_id: str
    project_key: str
    story_key: str = None
    db_session: Session = None


def chat_with_agent(
    messages: list,
    connection_id: str,
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
            connection_id=connection_id,
            project_key=project_key,
            story_key=story_key,
            db_session=db_session,
        ),
    )

    return response


def stream_with_agent(
    messages: list,
    session_id: str,
    connection_id: str,
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
            connection_id=connection_id,
            project_key=project_key,
            story_key=story_key,
            db_session=db_session,
        ),
        stream_mode="messages",
    ):
        yield chunk, metadata
