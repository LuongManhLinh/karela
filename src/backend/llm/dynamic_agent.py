from langchain_core.messages import BaseMessage
from pydantic import BaseModel
from typing import Iterator, Literal, Callable, Optional

from .gemini_dynamic_agent import GenimiDynamicAgent
from .openai_dynamic_agent import OpenAIDynamicAgent


class DynamicAgent:
    """
    Wrapper that delegates to GeminiDynamicAgent or OpenAIDynamicAgent
    based on the ``family`` parameter.
    """

    def __init__(
        self,
        model_name: str,
        api_keys: list[str],
        model_provider: Literal["gemini", "openai"] = "gemini",
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
        if model_provider == "openai":
            self._delegate = OpenAIDynamicAgent(
                model_name=model_name,
                api_keys=api_keys,
                system_prompt=system_prompt,
                temperature=temperature,
                response_schema=response_schema,
                tools=tools,
                middleware=middleware,
                max_retries=max_retries,
                initial_delay=initial_delay,
                max_delay=max_delay,
                backoff_factor=backoff_factor,
                retry_on=retry_on,
                top_p=top_p,
                alternative_model_names=alternative_model_names,
            )
        else:
            self._delegate = GenimiDynamicAgent(
                model_name=model_name,
                api_keys=api_keys,
                system_prompt=system_prompt,
                temperature=temperature,
                response_mime_type=response_mime_type,
                response_schema=response_schema,
                tools=tools,
                middleware=middleware,
                max_retries=max_retries,
                initial_delay=initial_delay,
                max_delay=max_delay,
                backoff_factor=backoff_factor,
                retry_on=retry_on,
                top_p=top_p,
                alternative_model_names=alternative_model_names,
            )

    @property
    def agent(self):
        return self._delegate.agent

    @property
    def model(self):
        return self._delegate.model

    @property
    def response_schema(self):
        return self._delegate.response_schema

    def invoke(self, messages: list[BaseMessage] | list[dict], *args, **kwargs):
        return self._delegate.invoke(messages, *args, **kwargs)

    def stream(
        self, messages: list[BaseMessage] | list[dict], *args, **kwargs
    ) -> Iterator:
        yield from self._delegate.stream(messages, *args, **kwargs)

    def batch(
        self, messages_list: list[list[BaseMessage] | list[dict]], *args, **kwargs
    ):
        return self._delegate.batch(messages_list, *args, **kwargs)
