from app.integrations.jira.services import JiraService
from common.database import get_db

service = JiraService(db=next(get_db()))
conn_id = "59af2ae6-f7bd-4c9a-85e9-c0c830f2d1ee"

service.delete_webhook(connection_id=conn_id, webhook_id=1)
service.delete_webhook(connection_id=conn_id, webhook_id=2)
