from langchain.agents import create_agent
from langchain.agents.structured_output import ProviderStrategy
from langchain.agents.middleware import ModelRetryMiddleware
from langchain_google_genai.chat_models import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage
from pydantic import BaseModel
import random
from typing import Iterator, Literal, Callable, Optional

from utils.json_processor import schema_without_titles


class RotationMiddleware:
    """Middleware to rotate API keys on retries."""

    def __init__(
        self,
        api_keys: list[str],
        on_api_key_rotate: Callable[[str], None],
        model_names: list[str],
        on_model_rotate: Callable[[str], None],
    ):
        self.api_keys = api_keys
        self.on_api_key_rotate = on_api_key_rotate
        # self.model = model
        self._cur_api_idx = random.randint(0, len(api_keys) - 1)
        self.model_names = model_names
        self.on_model_rotate = on_model_rotate
        self._cur_model_idx = 0

    def __call__(self, exception: Exception) -> str:
        """Rotate to next API key and return error message."""
        exception_str = str(exception)
        if "429" in exception_str and self.api_keys:
            self._cur_api_idx = (self._cur_api_idx + 1) % len(self.api_keys)
            # self.model.google_api_key = self.api_keys[self._current_index]
            print(
                f"Rotated to API key index: {self._cur_api_idx}. Reason: {exception_str}"
            )
            self.on_api_key_rotate(self.api_keys[self._cur_api_idx])
        elif self.model_names:
            # We are using Gemini, most errors occur because of Service Exhaustion, so we rotate the model instead of the API key
            self._cur_model_idx = (self._cur_model_idx + 1) % len(self.model_names)
            print(
                f"Rotated to model index: {self._cur_model_idx}. Reason: {exception_str}"
            )
            self.on_model_rotate(self.model_names[self._cur_model_idx])

        return f"Retrying with different API key after error: {str(exception)}"


class GenimiDynamicAgent:
    """
    Enhanced dynamic agent using LangChain's ModelRetryMiddleware for robust error handling.
    Supports dynamic prompts via middleware and automatic API key rotation.
    """

    def __init__(
        self,
        model_name: str,
        api_keys: list[str],
        system_prompt: str | Callable = None,
        temperature: float = 0.7,
        response_mime_type: Literal[
            "application/json", "text/plain", "text/x.enum"
        ] = "text/plain",
        response_schema: Optional[BaseModel] = None,
        tools: list = None,
        middleware: list = None,
        max_retries: int = 3,
        initial_delay: float = 1.0,
        max_delay: float = 60.0,
        backoff_factor: float = 2.0,
        retry_on: tuple = (Exception,),
        top_p: float = 1.0,
        alternative_model_names: list[str] = [],
    ):
        """
        Initialize GenimiDynamicAgent with ModelRetryMiddleware.

        Args:
            system_prompt: Static string or dynamic prompt middleware function
            model_name: Gemini model name
            temperature: Model temperature
            api_keys: list of API keys for rotation
            response_mime_type: Response format
            response_schema: Pydantic schema for structured output
            tools: list of tools for the agent
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
            top_p=top_p,
        )

        # Setup middleware
        middleware_list = middleware or []

        def on_api_key_rotate(new_key: str):
            self.model.google_api_key = new_key

        def on_model_rotate(new_model: str):
            self.model.model = new_model

        if model_name in alternative_model_names:
            print(
                f"Warning: Initial model {model_name} is in alternative_model_names list. Consider removing it to avoid immediate rotation on first failure."
            )
        # Add API key rotation on failure
        api_rotation = RotationMiddleware(
            api_keys=api_keys,
            on_api_key_rotate=on_api_key_rotate,
            model_names=alternative_model_names,
            on_model_rotate=on_model_rotate,
        )

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

    def invoke(self, messages: list[BaseMessage] | list[dict], *args, **kwargs):
        """
        Invoke the agent with automatic retry and API key rotation.

        Args:
            messages: Input messages

        Returns:
            Agent response with structured output if schema provided
        """
        return self.agent.invoke({"messages": messages}, *args, **kwargs)

    def stream(
        self, messages: list[BaseMessage] | list[dict], *args, **kwargs
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

    def batch(
        self, messages_list: list[list[BaseMessage] | list[dict]], *args, **kwargs
    ):
        """
        Batch process multiple sets of messages with automatic retry.

        Args:
            messages_list: list of message sets

        Returns:
            list of agent responses
        """
        return self.agent.batch(
            [{"messages": msgs} for msgs in messages_list], *args, **kwargs
        )
