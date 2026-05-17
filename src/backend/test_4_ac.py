import json
import time
import os
from app.connection.jira.services import JiraService
from common.database import get_db
from app.ac.agents.graph import generate_ac_from_story

conn_id = "515b536d-ab6f-4c9c-9e8e-caf2147d0aed"
project_key = "IB2"

story_key = "IB2-2"

jira_service = JiraService(db=next(get_db()))
project_desc = jira_service.get_project_description(
    connection_id=conn_id, project_key=project_key
)

stories = jira_service.fetch_stories(
    connection_id=conn_id,
    project_key=project_key,
    story_keys=[story_key],
)

if not stories:
    print(f"Could not fetch story: {story_key}")
    exit(1)

story = stories[0]


print("Generating AC...")
start_time = time.time()
ac_result = generate_ac_from_story(
    summary=story.summary,
    description=story.description,
    db=next(get_db()),
    connection_id=conn_id,
    project_key=project_key,
    project_description=project_desc,
)

end_time = time.time()
print(f"Generated AC in {end_time - start_time:.2f} seconds")

output_dir = "data/IntelligenceBank/ac/gemini"
os.makedirs(output_dir, exist_ok=True)
output_file = f"{output_dir}/{project_key}_{story_key}_ac.json"

with open(output_file, "w") as f:
    json.dump(
        {
            "story_key": story_key,
            "summary": story.summary,
            "description": story.description,
            "generated_ac": ac_result,
        },
        f,
        indent=2,
    )

print(f"Saved AC output to {output_file}")
