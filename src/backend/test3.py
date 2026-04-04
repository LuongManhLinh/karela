from app.connection.jira.services.main_service import JiraService
from common.database import get_db
import json

service = JiraService(next(get_db()))
service.delete_connection("515b536d-ab6f-4c9c-9e8e-caf2147d0aed")
service.delete_connection("87dd560a-2d5f-427b-8fc3-fbd346ab0c51")
