from typing import Optional
from dataclasses import dataclass
from common.agents.schemas import LlmContext


class Context(LlmContext):
    session_id: str
    extra_instruction: Optional[str] = None
