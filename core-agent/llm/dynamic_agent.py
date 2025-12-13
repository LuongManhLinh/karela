from langchain.agents import create_agent
from langchain.agents.structured_output import ProviderStrategy
from langchain.agents.middleware import ModelRetryMiddleware
from langchain_google_genai.chat_models import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage
from pydantic import BaseModel
import random
from typing import Iterator, List, Dict, Literal, Callable, Optional

from utils.json_processor import schema_without_titles


class APIKeyRotationMiddleware:
    """Middleware to rotate API keys on retries."""

    def __init__(self, api_keys: List[str], model: ChatGoogleGenerativeAI):
        self.api_keys = api_keys
        self.model = model
        self._current_index = random.randint(0, len(api_keys) - 1)

    def __call__(self, exception: Exception) -> str:
        """Rotate to next API key and return error message."""
        self._current_index = (self._current_index + 1) % len(self.api_keys)
        self.model.google_api_key = self.api_keys[self._current_index]
        print(f"Rotated to API key index: {self._current_index}")
        return f"Retrying with different API key after error: {str(exception)}"


class GenimiDynamicAgent:
    """
    Enhanced dynamic agent using LangChain's ModelRetryMiddleware for robust error handling.
    Supports dynamic prompts via middleware and automatic API key rotation.
    """

    def __init__(
        self,
        system_prompt: str | Callable,
        model_name: str,
        temperature: float,
        api_keys: List[str],
        response_mime_type: Literal[
            "application/json", "text/plain", "text/x.enum"
        ] = "text/plain",
        response_schema: Optional[BaseModel] = None,
        tools: List = None,
        middleware: List = None,
        max_retries: int = 3,
        initial_delay: float = 1.0,
        max_delay: float = 60.0,
        backoff_factor: float = 2.0,
        retry_on: tuple = (Exception,),
    ):
        """
        Initialize GenimiDynamicAgent with ModelRetryMiddleware.

        Args:
            system_prompt: Static string or dynamic prompt middleware function
            model_name: Gemini model name
            temperature: Model temperature
            api_keys: List of API keys for rotation
            response_mime_type: Response format
            response_schema: Pydantic schema for structured output
            tools: List of tools for the agent
            middleware: Additional middleware functions
            max_retries: Maximum retry attempts (default: 3)
            initial_delay: Initial delay before first retry in seconds (default: 1.0)
            max_delay: Maximum delay between retries (default: 60.0)
            backoff_factor: Exponential backoff multiplier (default: 2.0)
            retry_on: Tuple of exceptions to retry on
        """
        if not api_keys or len(api_keys) == 0:
            raise ValueError("At least one API key must be provided")

        self.api_keys = api_keys
        self._api_key_index = random.randint(0, len(api_keys) - 1)

        # Initialize model
        self.model = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            google_api_key=api_keys[self._api_key_index],
            response_mime_type=response_mime_type,
            response_schema=(
                schema_without_titles(response_schema) if response_schema else None
            ),
            max_retries=0,  # Disable model-level retries, use middleware instead
        )

        # Setup middleware
        middleware_list = middleware or []

        # Add API key rotation on failure
        api_rotation = APIKeyRotationMiddleware(api_keys, self.model)

        # Add retry middleware with exponential backoff and API key rotation
        retry_middleware = ModelRetryMiddleware(
            max_retries=max_retries,
            retry_on=retry_on,
            on_failure=api_rotation,
            backoff_factor=backoff_factor,
            initial_delay=initial_delay,
            max_delay=max_delay,
            jitter=True,
        )

        middleware_list.insert(0, retry_middleware)

        # Create agent with middleware
        self.agent = create_agent(
            model=self.model,
            system_prompt=system_prompt,
            tools=tools or [],
            middleware=middleware_list,
            response_format=(
                ProviderStrategy(response_schema) if response_schema else None
            ),
        )

        self.response_schema = response_schema

    def invoke(self, messages: List[BaseMessage] | List[Dict], *args, **kwargs):
        """
        Invoke the agent with automatic retry and API key rotation.

        Args:
            messages: Input messages

        Returns:
            Agent response with structured output if schema provided
        """
        return self.agent.invoke({"messages": messages}, *args, **kwargs)

    def stream(
        self, messages: List[BaseMessage] | List[Dict], *args, **kwargs
    ) -> Iterator:
        """
        Stream agent responses with automatic retry.

        Args:
            messages: Input messages

        Yields:
            Response chunks
        """
        stream_gen = self.agent.stream({"messages": messages}, *args, **kwargs)

        for chunk in stream_gen:
            yield chunk
