from langchain.agents import create_agent, AgentState
from langchain.agents.structured_output import ProviderStrategy
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_google_genai.chat_models import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage
from pydantic import BaseModel
import random
from typing import Callable, List, Dict, Any

from utils.json_processor import schema_without_titles
from .dynamic_llm import LogCallback


class GenimiDynamicAgent:
    def __init__(
        self,
        system_prompt: str,
        model_name: str,
        temperature: float,
        api_keys: list[str],
        response_mime_type: str = "text/plain",
        response_schema: BaseModel = None,
        tools: list = [],
        middleware=[],
        max_retries=3,
        retry_delay_ms=1000,
        errors_to_retry=None,
    ):
        if not api_keys or len(api_keys) == 0:
            raise ValueError("At least one API key must be provided")

        self.api_keys = api_keys
        self._api_key_index = random.randint(0, len(api_keys) - 1)

        self.model = ChatGoogleGenerativeAI(
            model=model_name,
            temperature=temperature,
            google_api_key=api_keys[self._api_key_index],
            response_mime_type=response_mime_type,
            response_schema=(
                schema_without_titles(response_schema) if response_schema else None
            ),
            max_retries=1,
        )

        self.agent = create_agent(
            model=self.model,
            system_prompt=system_prompt,
            tools=tools,
            middleware=middleware,
            response_format=(
                ProviderStrategy(response_schema) if response_schema else None
            ),
        )

        self.max_retries = max_retries
        self.retry_delay_ms = retry_delay_ms
        self.errors_to_retry = errors_to_retry
        self.response_schema = response_schema

    def _rotate_api_key(self):
        self._api_key_index = (self._api_key_index + 1) % len(self.api_keys)
        self.model.open = self.api_keys[self._api_key_index]
        print(f"Rotated to API key index: {self._api_key_index}")

    def _run_with_retries(self, fn, *args, **kwargs):
        attempts = 0
        while attempts < self.max_retries:
            try:
                return fn(*args, **kwargs)
            except Exception as e:
                attempts += 1
                print(f"Error on attempt {attempts}: {e}")
                if (
                    attempts >= self.max_retries
                    or self.errors_to_retry is not None
                    and not isinstance(e, self.errors_to_retry)
                ):
                    raise
                self._rotate_api_key()
        raise RuntimeError("Max retries exceeded")

    def invoke(self, messages: List[BaseMessage] | List[Dict], *args, **kwargs):
        return self._run_with_retries(
            self.agent.invoke,
            {"messages": messages},
            *args,
            **kwargs,
        )


class OpenRouterDynamicAgent:
    def __init__(
        self,
        system_prompt: str,
        model_name: str,
        temperature: float,
        api_keys: list[str],
        response_mime_type: str = "text/plain",
        response_schema: BaseModel = None,
        tools: list = [],
        middleware=[],
        max_retries=3,
        retry_delay_ms=1000,
        errors_to_retry=None,
    ):
        if not api_keys or len(api_keys) == 0:
            raise ValueError("At least one API key must be provided")

        self.api_keys = api_keys
        self._api_key_index = random.randint(0, len(api_keys) - 1)

        self.model = ChatOpenAI(
            name=model_name,
            openai_api_key=api_keys[self._api_key_index],
            base_url="https://openrouter.ai/api/v1",
            temperature=temperature,
        )

        if response_schema:
            self.model.with_structured_output = response_schema

        self.agent = create_agent(
            model=self.model,
            system_prompt=system_prompt,
            tools=tools,
            middleware=middleware,
            response_format=(
                ProviderStrategy(response_schema) if response_schema else None
            ),
        )

        self.max_retries = max_retries
        self.retry_delay_ms = retry_delay_ms
        self.errors_to_retry = errors_to_retry
        self.response_schema = response_schema

    def _rotate_api_key(self):
        self._api_key_index = (self._api_key_index + 1) % len(self.api_keys)
        self.model.google_api_key = self.api_keys[self._api_key_index]
        print(f"Rotated to API key index: {self._api_key_index}")

    def _run_with_retries(self, fn, *args, **kwargs):
        attempts = 0
        while attempts < self.max_retries:
            try:
                return fn(*args, **kwargs)
            except Exception as e:
                attempts += 1
                print(f"Error on attempt {attempts}: {e}")
                if (
                    attempts >= self.max_retries
                    or self.errors_to_retry is not None
                    and not isinstance(e, self.errors_to_retry)
                ):
                    raise
                self._rotate_api_key()
        raise RuntimeError("Max retries exceeded")

    def invoke(self, messages: List[BaseMessage] | List[Dict], *args, **kwargs):
        return self._run_with_retries(
            self.agent.invoke,
            {"messages": messages},
            *args,
            **kwargs,
        )
