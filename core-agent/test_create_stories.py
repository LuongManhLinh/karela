from app.integrations.jira.schemas import CreateStoryRequest
from app.integrations.jira.services import JiraService
from common.database import get_db

import json

story_path = "./test_vbs.json"
with open(story_path, "r") as f:
    story_dicts = json.load(f)

# print(len(story_dicts))
stories = [CreateStoryRequest(**story_dict) for story_dict in story_dicts]

jira_service = JiraService(next(get_db()))

print("Creating stories...")
resp = jira_service.create_stories(
    connection_id="cdd3bcb8-6df2-4801-a3e1-14c341e7b2a2",
    project_key="VBS",
    stories=stories,
)

# resp = jira_service.create_story(
#     connection_id="91638c6f-21de-43d4-9011-2820470af6f7",
#     project_key="RD",
#     story=stories[0],
# )
# print("Created story:", resp)
# resp = jira_service.fetch_story_keys(
#     connection_id="91638c6f-21de-43d4-9011-2820470af6f7",
#     project_key="RD",
# )
# print(resp)
