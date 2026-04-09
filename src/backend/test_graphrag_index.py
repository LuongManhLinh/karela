from app.graphrag.index import index_user_stories
from app.connection.jira.services import JiraService
from common.database import get_db

service = JiraService(next(get_db()))
stories = service.fetch_stories(
    connection_id="515b536d-ab6f-4c9c-9e8e-caf2147d0aed",
    project_key="VBS",
)

story_dicts = [
    {
        "id": story.id,
        "key": story.key,
        "summary": story.summary or f"Story {story.key}",
        "description": f"SUMMARY:\n{story.summary}\n\nDESCRIPTION:\n{story.description}",
    }
    for story in stories
]

# Index first 20 stories for testing
index_user_stories(
    connection_id="515b536d-ab6f-4c9c-9e8e-caf2147d0aed",
    project_key="VBS",
    user_stories=story_dicts[:20],
)
