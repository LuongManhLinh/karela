from app.taxonomy.services import TaxonomyService
from app.connection.jira.services import JiraService
from app.analysis.agents.schemas import StoryMinimal
from common.database import get_db

conn_id = "515b536d-ab6f-4c9c-9e8e-caf2147d0aed"
project_key = "VBS"

service = TaxonomyService(db=next(get_db()))
jira_service = JiraService(db=next(get_db()))

stories = jira_service.fetch_stories(connection_id=conn_id, project_key=project_key)
# stories = [
#     UserStoryMinimal(key=s.key, summary=s.summary, description=s.description)
#     for s in stories
# ]

# system_context = """The Vehicle Booking System is designed to facilitate the booking of rides for passengers, the acceptance and completion of rides by drivers, and the management of the overall system by admins. The main functions of the system include searching rides, booking rides, accepting rides, completing rides, and managing user accounts, etc.. The system is intended to provide a seamless and efficient experience for all users while ensuring the safety and reliability of the service."""

# service.initialize_buckets(
#     connection_id=conn_id,
#     project_key=project_key,
#     stories=stories,
#     project_context=system_context,
# )

story_to_tags, tag_to_stories = service.get_project_stories_tags(
    connection_id=conn_id, project_key=project_key
)
print("STORY TO TAGS")
# print in sorted story key order
for story in stories:
    print(f"{story.key}: {story.summary}")
    print(f"Tags: {story_to_tags.get(story.key, set())}")
    print("---")

print("\nTAG TO STORIES")
# print in sorted tag name order
for tag in sorted(tag_to_stories.keys()):
    print(f"{tag}: {tag_to_stories[tag]}")
