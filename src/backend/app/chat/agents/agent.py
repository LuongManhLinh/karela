from llm.dynamic_agent import GenimiDynamicAgent
from langchain.agents.middleware import dynamic_prompt, ModelRequest
from langchain_core.messages import BaseMessage, HumanMessage

from sqlalchemy.orm import Session

from common.configs import GeminiConfig
from .prompts import SYSTEM_PROMPT, CHAT_TITLER_SYSTEM_PROMPT
from .tools import tools
from .context import Context


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
    extra_prompt = request.runtime.context.extra_prompt or ""
    return SYSTEM_PROMPT.format(
        extra_prompt=extra_prompt,
    )


chat_agent = GenimiDynamicAgent(
    model_name=GeminiConfig.GEMINI_API_CHAT_MODEL,
    temperature=GeminiConfig.GEMINI_API_CHAT_TEMPERATURE,
    tools=tools,
    middleware=[user_context_prompt],
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
)

titler_agent = GenimiDynamicAgent(
    model_name=GeminiConfig.GEMINI_API_CHAT_MODEL,
    temperature=GeminiConfig.GEMINI_API_CHAT_TEMPERATURE,
    system_prompt=CHAT_TITLER_SYSTEM_PROMPT,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
    max_retries=GeminiConfig.GEMINI_API_MAX_RETRY,
)


def chat_with_agent(
    messages: list[BaseMessage],
    connection_id: str,
    session_id: str,
    db: Session,
    project_key: str,
    extra_prompt: str = None,
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

    response = chat_agent.invoke(
        messages,
        context=Context(
            session_id=session_id,
            connection_id=connection_id,
            project_key=project_key,
            db=db,
            extra_prompt=extra_prompt,
        ),
    )

    return response


def stream_with_agent(
    messages: list[BaseMessage],
    connection_id: str,
    session_id: str,
    db: Session,
    project_key: str,
    extra_prompt: str = None,
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

    for chunk, metadata in chat_agent.stream(
        messages,
        context=Context(
            session_id=session_id,
            connection_id=connection_id,
            project_key=project_key,
            db=db,
            extra_prompt=extra_prompt,
        ),
        stream_mode="messages",
    ):
        yield chunk, metadata


def generate_chat_title(
    first_user_message: str,
) -> str:
    """Generate a concise and descriptive title for a chat session based on the first user message."""
    response = titler_agent.invoke(
        [
            HumanMessage(
                content=f"Generate title for the following message: {first_user_message}"
            )
        ],
    )
    try:
        title = response["messages"][-1].content.strip()
    except:
        title = "New Chat Session"
    return title
