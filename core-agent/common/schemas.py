from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, List
import re
from enum import Enum


def to_camel(s: str) -> str:
    return re.sub(r"_([a-z])", lambda m: m.group(1).upper(), s)


@DeprecationWarning
class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class BasicResponse(BaseModel):
    detail: Optional[str] = None
    data: Optional[Any] = None
    errors: Optional[List[Any]] = None


class Platform(str, Enum):
    JIRA = "JIRA"
    AZURE_DEVOPS = "AZURE_DEVOPS"
