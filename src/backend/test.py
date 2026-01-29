from app.connection.jira.services import JiraService
from common.database import get_db
import time

service = JiraService(db=next(get_db()))
connection_id = "d7ec6fae-7625-406e-8fd8-855916367d03"
project_keys = ["RD", "MK", "AS", "SAF", "VBS"]

for project_key in project_keys:
    stories = service.fetch_stories(
        connection_id=connection_id,
        project_key=project_key,
        story_keys=None,
        local=False,
    )
    print(f"Project: {project_key}, Stories fetched: {len(stories)}")
    # Delay to avoid overwhelming the server
    time.sleep(2)
