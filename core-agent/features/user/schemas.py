from pydantic import BaseModel, ConfigDict
from typing import Optional, List

from features.integrations.jira.schemas import JiraConnectionDto


class RegisterUserRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

    model_config = ConfigDict(extra="forbid")


class AuthenticateUserRequest(BaseModel):
    username_or_email: str
    password: str

    model_config = ConfigDict(extra="forbid")


class UserDto(BaseModel):
    username: str
    email: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

    model_config = ConfigDict(extra="forbid")


class UserConnections(BaseModel):
    jira_connections: List[JiraConnectionDto] = []
    azure_devops_connections: List = []
