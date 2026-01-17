from sqlalchemy.orm import Session
from datetime import datetime

from app.connection.jira.services.base_service import (
    AC_ISSUE_TYPE_DESCRIPTION,
    AC_ISSUE_TYPE_LEVEL,
    AC_ISSUE_TYPE_NAME,
)
from utils.markdown_adf_bridge.markdown_adf_bridge import adf_to_md
from common.configs import JiraConfig
from common.database import uuid_generator
from .base_service import JiraBaseService
from ..client import JiraClient
from ..models import GherkinAC, JiraConnection, JiraProject, JiraStory, JiraSyncError
from ..schemas import (
    StoryDto,
)


class JiraConnectService(JiraBaseService):
    def __init__(self, db: Session):
        super().__init__(db)

    def setup_connection(self, connection_id: str, new: bool = True):
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        self._on_connection_update(connection)

        if new:
            issue_type_id = self._create_ac_issue_type(connection)
            self._update_issue_type_for_connection(connection, issue_type_id)

            self._register_webhooks(connection)

        connection.sync_status = "SYNCED"
        self.db.commit()

    def _on_connection_update(self, connection: JiraConnection):
        """Fetch projects and stories from Jira and cache them locally, including vector store"""
        connection.sync_status = "Starting sync..."
        connection.sync_error = None
        self.db.add(connection)
        self.db.commit()

        try:
            # Clear existing projects and stories for this connection
            self.db.query(JiraProject).filter(
                JiraProject.jira_connection_id == connection.id
            ).delete()
            self.db.commit()

            # Fetch all projects from Jira
            print("Fetching projects from Jira...")
            projects_data = self._exec_refreshing_access_token(
                connection,
                JiraClient.fetch_projects,
                cloud_id=connection.cloud_id,
            )

            # Save projects and fetch stories for each
            for project_data in projects_data:
                print("Processing project:", project_data.key)
                connection.sync_status = "Syncing project " + project_data.key
                self.db.commit()
                jira_project = JiraProject(
                    id=project_data.id,
                    key=project_data.key,
                    name=project_data.name,
                    avatar_url=project_data.avatar_url,
                    jira_connection_id=connection.id,
                )
                self.db.add(jira_project)
                self.db.flush()

                project_stories: list[StoryDto] = []

                # Fetch stories for this project
                issues = self.fetch_issues(
                    connection_id=connection.id,
                    jql=f'project = "{project_data.key}" AND issuetype in (Story, {AC_ISSUE_TYPE_NAME})',
                    fields=["summary", "description"],
                )

                # Save stories locally
                for issue in issues:
                    description_md = (
                        adf_to_md(issue.fields.description)
                        if issue.fields.description
                        else None
                    )
                    if issue.fields.issuetype.name == "Story":
                        jira_story = JiraStory(
                            id=issue.id,
                            key=issue.key,
                            summary=issue.fields.summary,
                            description=description_md,
                            jira_project_id=jira_project.id,
                            created_at=issue.fields.created,
                        )
                        self.db.add(jira_story)
                        project_stories.append(
                            StoryDto(
                                id=jira_story.id,
                                key=issue.key,
                                summary=issue.fields.summary,
                                description=description_md,
                            )
                        )
                    else:
                        gherkin_ac = GherkinAC(
                            id=issue.id,
                            key=issue.key,
                            summary=issue.fields.summary,
                            description=description_md or "",
                            jira_story_id=(
                                issue.fields.parent.id if issue.fields.parent else None
                            ),
                            created_at=issue.fields.created,
                        )
                        self.db.add(gherkin_ac)

                # Push this project's stories to vector store
                if project_stories:
                    print("Persisting stories to vector store...")
                    self.vector_store.add_stories(
                        connection_id=connection.id,
                        project_key=project_data.key,
                        stories=project_stories,
                    )

            connection.sync_status = "Sync completed"
            self.db.commit()

        except Exception as e:
            self.db.rollback()
            print(f"Error updating connection: {e}")
            connection.sync_status = f"Sync failed: {e}"
            connection.sync_error = JiraSyncError.DATA_SYNC_ERROR
            self.db.commit()
            raise

    def _update_issue_type_for_connection(
        self, connection: JiraConnection, issue_type_id: str
    ):
        connection.sync_status = "Updating issue types for projects..."
        self.db.add(connection)
        self.db.commit()
        try:
            self._exec_refreshing_access_token(
                connection=connection,
                func=JiraClient.add_issue_type_to_activated_schemes,
                cloud_id=connection.cloud_id,
                issue_type_id=issue_type_id,
            )
        except Exception as e:
            print(f"Error adding issue type to projects: {e}")
            connection.sync_status = f"Failed to update issue types: {e}"
            connection.sync_error = JiraSyncError.ISSUE_TYPE_SCHEME_ERROR
            self.db.commit()
            raise

    def _register_webhooks(self, connection: JiraConnection):
        """Register webhooks for the Jira connection"""
        connection.sync_status = "Registering webhooks..."
        self.db.add(connection)
        self.db.commit()
        try:
            self._exec_refreshing_access_token(
                connection=connection,
                func=JiraClient.register_webhook,
                cloud_id=connection.cloud_id,
                url=f"{JiraConfig.WEBHOOK_URL}/{connection.id}",
                events=JiraConfig.WEBHOOK_EVENTS,
            )
        except Exception as e:
            print(f"Error registering webhooks: {e}")
            connection.sync_status = f"Failed to register webhooks: {e}"
            connection.sync_error = JiraSyncError.WEBHOOK_ERROR
            self.db.commit()
            raise

    def _create_ac_issue_type(self, connection: JiraConnection):
        """Create 'AC' issue type in Jira if it doesn't exist"""
        connection.sync_status = "Creating AC issue type..."
        self.db.add(connection)
        self.db.commit()
        try:
            issue_type_id = self._exec_refreshing_access_token(
                connection=connection,
                func=JiraClient.create_issue_type,
                cloud_id=connection.cloud_id,
                name=AC_ISSUE_TYPE_NAME,
                description=AC_ISSUE_TYPE_DESCRIPTION,
                level=AC_ISSUE_TYPE_LEVEL,
            )
            return issue_type_id
        except Exception as e:
            if "409" in str(e):
                issue_type_id = self._exec_refreshing_access_token(
                    connection=connection,
                    func=JiraClient.get_issue_type_by_name,
                    cloud_id=connection.cloud_id,
                    name=AC_ISSUE_TYPE_NAME,
                )
                if issue_type_id is None:
                    connection.sync_error = JiraSyncError.ISSUE_TYPE_ERROR
                    connection.sync_status = f"Failed to retrieve existing {AC_ISSUE_TYPE_NAME} issue type ID"
                    self.db.commit()
                    raise ValueError(
                        f"Failed to retrieve existing {AC_ISSUE_TYPE_NAME} issue type ID"
                    )

                return issue_type_id
            else:
                connection.sync_status = (
                    f"Error creating {AC_ISSUE_TYPE_NAME} issue type: {e}"
                )
                connection.sync_error = JiraSyncError.ISSUE_TYPE_ERROR
                self.db.commit()
                raise
