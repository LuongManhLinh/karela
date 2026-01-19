from pydantic import BaseModel, ConfigDict

from .jira.schemas import StorySummary


class DashboardDto(BaseModel):
    num_analyses: int
    num_chats: int
    num_proposals: int
    num_acs: int

    model_config: ConfigDict = ConfigDict(extra="ignore")


class ProjectDashboardDto(DashboardDto):
    num_stories: int
    stories_with_analyses: list[StorySummary]
    stories_with_chats: list[StorySummary]
    stories_with_proposals: list[StorySummary]
    stories_with_acs: list[StorySummary]


class StoryDashboardDto(DashboardDto):
    pass
