from integrations.jira.client import default_client
from utils.markdown_adf_bridge import md_to_adf
from integrations.jira.schemas import (
    IssuesCreateRequest,
    IssueUpdate,
    IssueUpdateFields,
    Project,
    IssueType,
)

# a = default_client.create_issues(
#     issues=IssuesCreateRequest(
#         issueUpdates=[
#             IssueUpdate(
#                 fields=IssueUpdateFields(
#                     project=Project(key="AF"),
#                     summary="Issue created via API",
#                     description=md_to_adf(
#                         "This issue was created using the **Jira API** via a Python client."
#                     ),
#                     issuetype=IssueType(name="Task"),
#                 )
#             )
#         ]
#     )
# )

# Use dict instead of Issue object to print only relevant info
b = default_client.create_issues(
    issues=IssuesCreateRequest(
        **{
            "issueUpdates": [
                {
                    "fields": {
                        "project": {"key": "AF"},
                        "summary": "Issue created via API dict",
                        "description": md_to_adf(
                            "This issue was created using the **Jira API** via a Python client."
                        ),
                        "issuetype": {"name": "Task"},
                    }
                }
            ]
        }
    )
)

print(b)
