from app.taxonomy.services import TaxonomyService
from app.connection.jira.services import JiraService
from app.analysis.agents.schemas import StoryMinimal
from common.database import get_db
import time
from natsort import natsorted

conn_id = "515b536d-ab6f-4c9c-9e8e-caf2147d0aed"
project_key = "IB2"

print("Preparing to initialize taxonomy buckets...")
service = TaxonomyService(db=next(get_db()))

jira_service = JiraService(db=next(get_db()))

stories = jira_service.fetch_stories(connection_id=conn_id, project_key=project_key)
stories = natsorted(stories, key=lambda s: s.key)  # Sort stories by key

project_desc = jira_service.get_project_description(
    connection_id=conn_id, project_key=project_key
)
start_time = time.time()
service.initialize_buckets(
    connection_id=conn_id,
    project_key=project_key,
    stories=[StoryMinimal(key=story.key, summary=story.summary) for story in stories],
    project_description=project_desc,
)
end_time = time.time()
print(f"Time taken to initialize buckets: {end_time - start_time:.2f} seconds")

story_to_tags, tag_to_stories = service.get_project_stories_tags(
    connection_id=conn_id, project_key=project_key
)

buckets = service.get_all_buckets(connection_id=conn_id, project_key=project_key)
tag_to_desc = {bucket.name: bucket.description for bucket in buckets}


# Write the results above to files at folder data/{project_key}/

with open(f"data/{project_key}/story_to_tags.txt", "w") as f:
    for story in stories:
        f.write(f"{story.key}: {story_to_tags.get(story.key, set())}\n")

with open(f"data/{project_key}/tag_to_stories.md", "w") as f:
    for tag in sorted(tag_to_stories.keys()):
        f.write(f"## {tag}\n")
        f.write(f"### Stories:\n{tag_to_stories[tag]}\n")
        # Write description
        f.write(f"### Description:\n{tag_to_desc.get(tag, "")}\n")
        f.write("\n---\n\n")
