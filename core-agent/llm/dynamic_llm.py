import time
import random
from langchain_google_genai import ChatGoogleGenerativeAI
from google.api_core.exceptions import ResourceExhausted
from pydantic import BaseModel
from utils.json_processor import schema_without_titles
import functools
import json

from langchain_core.callbacks import BaseCallbackHandler


class LogCallback(BaseCallbackHandler):
    def on_llm_start(self, serialized, prompts, **kwargs):
        res_schema = (
            json.dumps(serialized["response_schema"], indent=2)
            if "response_schema" in serialized
            else "N/A"
        )
        sys_prompt = prompts[0]
        print(
            f"\n===== LLM START ===== \n System Prompt: {sys_prompt}\n Response Schema: {res_schema}\n"
        )

    def on_llm_end(self, response, **kwargs):
        print(
            f"\n===== LLM RESPONSE ===== \n {response.generations[0][0].message.content}"
        )
        # For chat models: `.generations[0][0].message.content`


def retry_wrap(target, max_attempt, on_retry, delay_ms=0):
    """
    Wraps a target object so that all its method calls are retried
    up to max_attempt times if an exception occurs.

    :param target: The object to wrap
    :param max_attempt: Maximum retry attempts
    :param on_retry: Callable taking the exception, returning True to retry, False to stop
    :return: A proxy object with retry logic
    """

    class Proxy:
        def __init__(self, target):
            self._target = target

        def __getattr__(self, name):
            attr = getattr(self._target, name)

            if not callable(attr):
                return attr

            @functools.wraps(attr)
            def wrapper(*args, **kwargs):
                attempts = 0
                while attempts < max_attempt:
                    try:
                        return attr(*args, **kwargs)
                    except Exception as e:
                        attempts += 1
                        if attempts >= max_attempt or not on_retry(e):
                            raise
                        time.sleep(delay_ms / 1000.0)

            return wrapper

    return Proxy(target)


class DynamicGeminiModel(ChatGoogleGenerativeAI):
    __ERRORS_TO_RETRY__ = (TimeoutError, ConnectionError, ResourceExhausted)

    def __init__(
        self,
        model_name: str,
        temperature: float,
        response_schema: BaseModel,
        api_keys: list[str],
        max_retries=3,
        retry_delay_ms=1000,
        errors_to_retry=None,
    ):
        if not api_keys or len(api_keys) == 0:
            raise ValueError("At least one API key must be provided")

        # Init the api key index randomly from 0 to len(api_keys)-1
        self._api_key_index = random.randint(0, len(api_keys) - 1)

        super().__init__(
            model=model_name,
            temperature=temperature,
            google_api_key=api_keys[self._api_key_index],
            response_mime_type="application/json",
            response_schema=schema_without_titles(response_schema),
            max_retries=1,
            callbacks=[LogCallback()],
        )

        self = retry_wrap(
            self,
            max_attempt=max_retries,
            on_retry=lambda e: self._on_retry(
                e, errors_to_retry or self.__ERRORS_TO_RETRY__
            ),
            delay_ms=retry_delay_ms,
        )

    def _rotate_api_key(self):
        self._api_key_index = (self._api_key_index + 1) % len(self.api_keys)
        self.google_api_key = self.api_keys[self._api_key_index]
        print(
            f"Rotated API key to index {self._api_key_index}, key: {self.google_api_key[:4]}****"
        )

    def _on_retry(self, e, errors_to_retry):
        if True:
            self._rotate_api_key()
            return True
        print("Not retrying for exception:", str(e), " type:", type(e))
        return False
