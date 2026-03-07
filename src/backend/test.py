from app.connection.jira.services import JiraService
from common.database import get_db

service = JiraService(next(get_db()))

a = service.fetch_project_dtos(
    user_id="d5d42940-0695-4cba-812c-489e4c34c478",
    connection_name="lmldev",
    local=False,
)

print(a)
