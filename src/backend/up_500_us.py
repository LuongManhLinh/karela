from app.connection.jira.schemas import CreateStoryRequest
from app.connection.jira.services import JiraService
import json
from common.database import get_db

print("Reading data")

with open("data/IntelligenceBank/test_100_us.json", "r") as f:
    data = json.load(f)

print(f"Read {len(data)} user stories")
stories = []
for issue in data:
    stories.append(
        CreateStoryRequest(
            summary=issue["user_story"], description=issue["requirements"]
        )
    )

print("Uploading...")
res = JiraService(next(get_db())).create_stories(
    connection_id="515b536d-ab6f-4c9c-9e8e-caf2147d0aed",
    project_key="IBT",
    stories=stories,
)
print("Results:", res)
