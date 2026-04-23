from app.connection.jira.services import JiraService
from common.database import get_db

service = JiraService(next(get_db()))

service.delete_connection(connection_id="515b536d-ab6f-4c9c-9e8e-caf2147d0aed")
