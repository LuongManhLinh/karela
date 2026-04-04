from app.connection.jira.schemas import CreateStoryRequest
from app.connection.jira.services import JiraService
import json
from common.database import get_db

print("Reading data")

with open("data/extracted_data.json", "r") as f:
    data = json.load(f)

data_len = len(data)  # = 500

start = 0
end = 2
data = data[start:end]
stories = []
for issue in data:
    print(f"{start}/{end - 1}")
    start += 1
    stories.append(
        CreateStoryRequest(
            summary=issue["user_story"], description=issue["requirements"]
        )
    )

print("Uploading...")
res = JiraService(next(get_db())).create_stories(
    connection_id="515b536d-ab6f-4c9c-9e8e-caf2147d0aed",
    project_key="IB",
    stories=stories,
)
print("Results:", res)
