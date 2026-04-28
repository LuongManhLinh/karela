from app.taxonomy.services import TaxonomyService
from app.connection.jira.services import JiraService
from app.analysis.agents.schemas import UserStoryMinimal
from common.database import get_db

conn_id = "sudo"
project_key = "TEST"

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

for story in stories:
    print(f"{story.key} - {story.summary}")
    tags = service.get_story_tags(
        connection_id=conn_id,
        project_key=project_key,
        story_key=story.key,
    )
    print(f"Tags: {tags}")
    print("---")
