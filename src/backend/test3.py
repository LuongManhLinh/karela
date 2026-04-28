from common.database import get_db, uuid_generator
from app.connection.jira.services import JiraService
from app.analysis.agents.utils import format_stories
from app.analysis.agents.schemas import UserStoryMinimal

service = JiraService(db=next(get_db()))
stories = [
    UserStoryMinimal(
        key=s.key,
        summary=s.summary,
        description=s.description,
    )
    for s in service.fetch_stories(
        connection_id="sudo",
        project_key="TEST",
    )
]

markdown_content = format_stories(stories)

with open("data/test/formatted_stories.md", "w") as f:
    f.write(markdown_content)
