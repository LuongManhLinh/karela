from langchain.agents import create_agent
from langchain.agents.structured_output import ProviderStrategy
from langchain.agents.middleware import ModelRetryMiddleware
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage
from pydantic import BaseModel
import random
from typing import Iterator, Literal, Callable, Optional

from llm.gemini_dynamic_agent import RotationMiddleware


class OpenAIDynamicAgent:
    """
    Dynamic agent using OpenAI (GPT) models with LangChain's ModelRetryMiddleware
    for robust error handling. Supports automatic API key rotation.
    """

    def __init__(
        self,
        model_name: str,
        api_keys: list[str],
        system_prompt: str | Callable = None,
        temperature: float = 0.7,
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
        if not api_keys or len(api_keys) == 0:
            raise ValueError("At least one API key must be provided")

        self.api_keys = api_keys
        self._api_key_index = random.randint(0, len(api_keys) - 1)

        # Initialize model
        self.model = ChatOpenAI(
            model=model_name,
            temperature=temperature,
            openai_api_key=api_keys[self._api_key_index],
            max_retries=0,  # Disable model-level retries, use middleware instead
            # top_p=top_p,
        )

        # Setup middleware
        middleware_list = middleware or []

        def on_api_key_rotate(new_key: str):
            self.model.openai_api_key = new_key

        def on_model_rotate(new_model: str):
            self.model.model_name = new_model

        if model_name in alternative_model_names:
            print(
                f"Warning: Initial model {model_name} is in alternative_model_names list. Consider removing it to avoid immediate rotation on first failure."
            )

        api_rotation = RotationMiddleware(
            api_keys=api_keys,
            on_api_key_rotate=on_api_key_rotate,
            model_names=alternative_model_names,
            on_model_rotate=on_model_rotate,
        )

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
        """Invoke the agent with automatic retry and API key rotation."""
        return self.agent.invoke({"messages": messages}, *args, **kwargs)

    def stream(
        self, messages: list[BaseMessage] | list[dict], *args, **kwargs
    ) -> Iterator:
        """Stream agent responses with automatic retry."""
        stream_gen = self.agent.stream({"messages": messages}, *args, **kwargs)

        for chunk in stream_gen:
            yield chunk

    def batch(
        self, messages_list: list[list[BaseMessage] | list[dict]], *args, **kwargs
    ):
        """Batch process multiple sets of messages with automatic retry."""
        return self.agent.batch(
            [{"messages": msgs} for msgs in messages_list], *args, **kwargs
        )
