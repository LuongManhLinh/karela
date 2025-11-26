from typing import Any, Dict, List, Optional
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict


class Project(BaseModel):
    key: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class IssueType(BaseModel):
    name: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class Priority(BaseModel):
    name: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class Status(BaseModel):
    name: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class Fields(BaseModel):
    project: Optional[Project] = None
    summary: Optional[str] = None
    issuetype: Optional[IssueType] = None
    description: Optional[Any] = None
    priority: Optional[Priority] = None
    status: Optional[Status] = None
    issuelinks: Optional[List[Dict[str, Any]]] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class RenderedFields(BaseModel):
    description: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class Issue(BaseModel):
    id: Optional[str] = None
    key: Optional[str] = None
    fields: Optional[Fields] = None
    rendered_fields: Optional[RenderedFields] = Field(
        default=None, alias="renderedFields"
    )

    model_config = {
        "extra": "ignore",
        "populate_by_name": True,
    }


class SearchResponse(BaseModel):
    total: Optional[int] = None
    issues: List[Issue] = Field(default_factory=list)

    model_config = ConfigDict(
        extra="ignore",
    )


class FieldName(Enum):
    PROJECT = "project"
    ISSUE_TYPE = "issuetype"
    ISSUE_LINKS = "issuelinks"
    STATUS = "status"
    ASSIGNEE = "assignee"
    REPORTER = "reporter"
    SUMMARY = "summary"
    DESCRIPTION = "description"
    LABELS = "labels"
    PRIORITY = "priority"
    CREATED = "created"
    UPDATED = "updated"
    DUEDATE = "duedate"
    FIX_VERSION = "fixVersion"
    AFFECTS_VERSION = "affectedVersion"
    SPRINT = "Sprint"


class IssueTypeName(Enum):
    BUG = "Bug"
    TASK = "Task"
    STORY = "Story"
    EPIC = "Epic"
    SUB_TASK = "Sub-task"


class IssueUpdateFields(BaseModel):
    project: Project
    issuetype: IssueType
    summary: Optional[str] = None
    description: Optional[Any] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class IssueUpdate(BaseModel):
    fields: IssueUpdateFields

    model_config = ConfigDict(
        extra="ignore",
    )


class IssuesCreateRequest(BaseModel):
    issue_updates: List[IssueUpdate] = Field(default_factory=list, alias="issueUpdates")


class ExchangeAutorizationCodeResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    token_type: str
    scope: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class JiraCloudInfoResponse(BaseModel):
    id: str
    name: Optional[str] = None
    url: Optional[str] = None
    scopes: Optional[List[str]] = None
    avatarUrl: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )


class JiraConnectionDto(BaseModel):
    id: str
    cloud_id: str
    name: Optional[str] = None
    url: Optional[str] = None
    avatar_url: Optional[str] = None

    model_config = ConfigDict(
        extra="ignore",
    )
