from common.database import get_db
from app.integrations.jira.services import JiraService
from app.integrations.jira.schemas import IssueUpdate
from utils.markdown_adf_bridge import md_to_adf

service = JiraService(next(get_db()))

service.create_issues(
    connection_id="d8201a35-40a2-4c57-878d-7154b3273914",
    issues=[
        IssueUpdate(
            **{
                "fields": {
                    "project": {"key": "AF"},
                    "issuetype": {"name": "Bug"},
                    "summary": "Test tao issue don gian",
                    "description": md_to_adf("Day la **mo ta** cua `issue`"),
                }
            }
        )
    ],
)
