import json
from app.connection.jira.models import Project, Story
from app.connection.jira.services import JiraService
from common.database import get_db
from sqlalchemy.orm import Session

connection_id = "515b536d-ab6f-4c9c-9e8e-caf2147d0aed"


def create_project(key: str, name: str, avatar_url: str | None = None):
    return Project(
        connection_id=connection_id,
        key=key,
        name=name,
        avatar_url=avatar_url,
        synced=True,
    )


def create_story(
    project_id: str, key: str, summary: str, description: str | None = None
):
    return Story(
        project_id=project_id,
        key=key,
        summary=summary,
        description=description,
    )


def initialize_test_project(
    project_key: str, project_name: str, avatar_url: str | None = None
):
    db = next(get_db())
    project = create_project(
        key=project_key,
        name=project_name,
        avatar_url=avatar_url,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    project_id = project.id
    with open("data/IntelligenceBank/test_100_us.json", "r") as f:
        data = json.load(f)

    for s in data:
        story = create_story(
            project_id=project_id,
            key=f"{project_key}-{s['id']}",
            summary=s["user_story"],
            description=s["requirements"],
        )
        db.add(story)
    db.commit()
    print(f"Created project '{project_name}' with {len(data)} stories.")


if __name__ == "__main__":
    initialize_test_project(
        project_key="IB1",
        project_name="IntelligenceBank 1",
        avatar_url="https://api.atlassian.com/ex/jira/515b536d-ab6f-4c9c-9e8e-caf2147d0aed/rest/api/3/universal_avatar/view/type/project/avatar/10421",
    )

    initialize_test_project(
        project_key="IB2",
        project_name="IntelligenceBank 2",
        avatar_url="https://api.atlassian.com/ex/jira/515b536d-ab6f-4c9c-9e8e-caf2147d0aed/rest/api/3/universal_avatar/view/type/project/avatar/10404",
    )

    initialize_test_project(
        project_key="IB3",
        project_name="IntelligenceBank 3",
        avatar_url="https://api.atlassian.com/ex/jira/515b536d-ab6f-4c9c-9e8e-caf2147d0aed/rest/api/3/universal_avatar/view/type/project/avatar/10415",
    )

    initialize_test_project(
        project_key="IB4",
        project_name="IntelligenceBank 4",
        avatar_url="https://api.atlassian.com/ex/jira/515b536d-ab6f-4c9c-9e8e-caf2147d0aed/rest/api/3/universal_avatar/view/type/project/avatar/10418",
    )
