from pydantic import BaseModel, ConfigDict

from .jira.schemas import ProjectDto, StorySummary


class DashboardDto(BaseModel):
    num_analyses: int
    num_proposals: int
    num_acs: int

    model_config: ConfigDict = ConfigDict(extra="ignore")


class StoryInfo(BaseModel):
    id: str
    key: str
    analysis_count: int = 0
    proposal_count: int = 0
    ac_count: int = 0
    is_ready: bool = False


class ProjectDashboardDto(DashboardDto):
    num_chats: int
    num_stories: int
    readiness_score: float


class StoryDashboardDto(DashboardDto):
    pass


class ProjectInfo(BaseModel):
    id: str
    key: str
    name: str | None = None
    analysis_count: int = 0
    chat_count: int = 0
    proposal_count: int = 0
    ac_count: int = 0


class ConnectionDashboardDto(DashboardDto):
    num_chats: int
    num_projects: int


class UpdateProjectDescriptionRequest(BaseModel):
    description: str

    model_config = ConfigDict(extra="forbid")
