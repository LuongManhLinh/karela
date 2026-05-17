from common.database import get_db
from app.connection.jira.services import JiraService

service = JiraService(db=next(get_db()))

desc = service.get_project_description(
    connection_id="515b536d-ab6f-4c9c-9e8e-caf2147d0aed", project_key="IB4"
)

print(desc)
