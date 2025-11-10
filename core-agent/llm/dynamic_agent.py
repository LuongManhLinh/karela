from langchain.agents import create_agent
from langchain.agents.structured_output import ProviderStrategy
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_google_genai.chat_models import ChatGoogleGenerativeAI
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import BaseModel
import random
from typing import Callable

from utils.json_processor import schema_without_titles


class GenimiDynamicAgent:
    def __init__(
        self,
        system_prompt: str,
        model_name: str,
        temperature: float,
        api_keys: list[str],
        response_schema: BaseModel = None,
        tools: list = [],
        session_history_provider: Callable[..., BaseChatMessageHistory] = None,
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
            response_mime_type="application/json",
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

        if session_history_provider:
            self.agent = RunnableWithMessageHistory(
                self.agent,
                session_history_provider,
                input_messages_key="messages",
                history_messages_key="messages",
            )

        self.max_retries = max_retries
        self.retry_delay_ms = retry_delay_ms
        self.errors_to_retry = errors_to_retry
        self.response_schema = response_schema

    def _rotate_api_key(self):
        self._api_key_index = (self._api_key_index + 1) % len(self.api_keys)
        self.model.google_api_key = self.api_keys[self._api_key_index]

    def _run_with_retries(self, fn, *args, **kwargs):
        attempts = 0
        while attempts < self.max_retries:
            try:
                return fn(*args, **kwargs)
            except Exception as e:
                attempts += 1
                if (
                    attempts >= self.max_retries
                    or self.errors_to_retry is not None
                    and not isinstance(e, self.errors_to_retry)
                ):
                    raise
                self._rotate_api_key()
        raise RuntimeError("Max retries exceeded")

    def invoke(self, user_message: str, *args, **kwargs):
        return self._run_with_retries(
            self.agent.invoke,
            {"messages": [HumanMessage(content=user_message)]},
            *args,
            **kwargs,
        )

    async def ainvoke(self, user_message: str, *args, **kwargs):
        return await self._run_with_retries(
            self.agent.ainvoke,
            {"messages": [HumanMessage(content=user_message)]},
            *args,
            **kwargs,
        )
