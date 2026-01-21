from sqlalchemy.orm import Session
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.connection.jira.services.base_service import (
    AC_ISSUE_TYPE_DESCRIPTION,
    AC_ISSUE_TYPE_LEVEL,
    AC_ISSUE_TYPE_NAME,
)
from common.database import uuid_generator
from utils.markdown_adf_bridge.markdown_adf_bridge import adf_to_md
from common.configs import JiraConfig
from .base_service import JiraBaseService
from ..client import JiraClient
from ..models import GherkinAC, Connection, Project, Story, JiraSyncError
from ..schemas import (
    StoryDto,
)


from common.redis_app import redis_client
import json


class JiraConnectService(JiraBaseService):
    def __init__(self, db: Session):
        super().__init__(db)
        self.redis_client = redis_client

    def _publish_status(self, connection: Connection, status: str, error: str = None):
        connection.sync_status = status
        if error:
            connection.sync_error = error
        self.db.commit()
        try:
            payload = {"id": connection.id, "sync_status": status}
            if error:
                payload["sync_error"] = error if isinstance(error, str) else error.value
            self.redis_client.publish(
                f"connection:{connection.id}", json.dumps(payload)
            )
        except Exception as e:
            print(f"Failed to publish connection update: {e}")

    def setup_connection(self, connection_id: str, new: bool = True):
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
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
        self._publish_status(connection, "SYNCED")

    def _on_connection_update(
        self, connection: Connection, project_batch_size: int = 5
    ):
        """Fetch projects and stories from Jira and cache them locally, including vector store"""
        self.db.add(connection)
        connection.sync_error = None
        self._publish_status(connection, "Starting sync...")

        try:
            # Fetch all projects from Jira
            print("Fetching projects from Jira...")
            projects_data = self._exec_refreshing_access_token(
                connection,
                JiraClient.fetch_projects,
                cloud_id=connection.id_,
            )

            # Get access token once for all concurrent operations
            # This also ensures token is refreshed if needed before concurrent work
            access_token = self._get_valid_access_token(connection)
            cloud_id = connection.id_

            def process_project(project_data):
                """Process a single project: fetch issues and return data for DB"""
                print("Processing project:", project_data.key)

                # Fetch stories for this project using pre-fetched token (no DB access)
                response = JiraClient.search_issues(
                    access_token=access_token,
                    cloud_id=cloud_id,
                    jql=f'project = "{project_data.key}" AND issuetype in ("Story", "{AC_ISSUE_TYPE_NAME}")',
                    fields=["summary", "description", "issuetype", "parent", "created"],
                )
                issues = response.issues

                stories: list[Story] = []
                gherkin_acs: list[GherkinAC] = []
                story_dtos: list[StoryDto] = []

                project_id = uuid_generator()
                project = Project(
                    id=project_id,
                    id_=project_data.id,
                    key=project_data.key,
                    name=project_data.name,
                    avatar_url=project_data.avatar_url,
                    connection_id=connection.id,
                )

                story_key_to_id_map = {}
                for issue in issues:
                    description_md = (
                        adf_to_md(issue.fields.description)
                        if issue.fields.description
                        else None
                    )
                    if issue.fields.issuetype.name == "Story":
                        story_id = uuid_generator()
                        stories.append(
                            Story(
                                id=story_id,
                                id_=issue.id,
                                key=issue.key,
                                summary=issue.fields.summary,
                                description=description_md,
                                project_id=project_id,
                            )
                        )
                        story_key_to_id_map[issue.key] = story_id
                        story_dtos.append(
                            StoryDto(
                                id=issue.id,
                                key=issue.key,
                                summary=issue.fields.summary,
                                description=description_md,
                            )
                        )
                    else:
                        gherkin_acs.append(
                            GherkinAC(
                                id_=issue.id,
                                key=issue.key,
                                summary=issue.fields.summary,
                                description=description_md or "",
                                story_id=(
                                    issue.fields.parent.key  # Placeholder, we will change to the correct ID below
                                    if issue.fields.parent
                                    else None
                                ),
                                created_at=issue.fields.created,
                            )
                        )
                for gherkin_ac in gherkin_acs:
                    story_id = story_key_to_id_map.get(gherkin_ac.story_id)
                    if story_id:
                        gherkin_ac.story_id = story_id

                return project, stories, gherkin_acs, story_dtos

            # Process projects in batches
            total_projects = len(projects_data)
            for batch_start in range(0, total_projects, project_batch_size):
                batch_end = min(batch_start + project_batch_size, total_projects)
                batch = projects_data[batch_start:batch_end]

                self._publish_status(
                    connection,
                    f"Syncing projects {batch_start + 1}-{batch_end} of {total_projects}: {', '.join(p.key for p in batch)}",
                )

                # Process batch concurrently
                with ThreadPoolExecutor(max_workers=project_batch_size) as executor:
                    futures = [
                        executor.submit(process_project, project_data)
                        for project_data in batch
                    ]

                    for future in as_completed(futures):
                        project, stories, gherkin_acs, story_dtos = future.result()

                        self.db.add(project)
                        self.db.add_all(stories)
                        self.db.add_all(gherkin_acs)

                        # Push this project's stories to vector store
                        if story_dtos:
                            self.vector_store.add_stories(
                                connection_id=connection.id,
                                project_key=project.key,
                                stories=story_dtos,
                            )

            self.db.commit()
            self._publish_status(connection, "Completing sync...")

        except Exception as e:
            self.db.rollback()
            print(f"Error updating connection: {e}")
            self._publish_status(
                connection=connection,
                status=f"Sync failed: {e}",
                error=JiraSyncError.DATA_SYNC_ERROR,
            )
            raise

    def _get_valid_access_token(self, connection: Connection) -> str:
        """Get a valid access token, refreshing if necessary"""
        from utils.security_utils import decrypt_token

        access_token = decrypt_token(connection.token, connection.token_iv)
        # Test the token with a simple API call
        try:
            JiraClient.fetch_projects(
                access_token=access_token, cloud_id=connection.id_
            )
            return access_token
        except Exception as e:
            if "401" in str(e) or "400" in str(e):
                # Token expired, refresh it
                return self.__refresh_access_token(connection)
            raise

    def _update_issue_type_for_connection(
        self, connection: Connection, issue_type_id: str
    ):
        connection.sync_status = "Updating issue types for projects..."
        self.db.add(connection)
        self.db.commit()
        self._publish_status(connection.id, "Updating issue types for projects...")
        try:
            self._exec_refreshing_access_token(
                connection=connection,
                func=JiraClient.add_issue_type_to_activated_schemes,
                cloud_id=connection.id_,
                issue_type_id=issue_type_id,
            )
        except Exception as e:
            print(f"Error adding issue type to projects: {e}")
            connection.sync_status = f"Failed to update issue types: {e}"
            connection.sync_error = JiraSyncError.ISSUE_TYPE_SCHEME_ERROR
            self.db.commit()
            raise

    def _register_webhooks(self, connection: Connection):
        """Register webhooks for the Jira connection"""
        connection.sync_status = "Registering webhooks..."
        self.db.add(connection)
        self.db.commit()
        try:
            self._exec_refreshing_access_token(
                connection=connection,
                func=JiraClient.register_webhook,
                cloud_id=connection.id_,
                url=f"{JiraConfig.WEBHOOK_URL}/{connection.id}",
                events=JiraConfig.WEBHOOK_EVENTS,
            )
        except Exception as e:
            print(f"Error registering webhooks: {e}")
            connection.sync_status = f"Failed to register webhooks: {e}"
            connection.sync_error = JiraSyncError.WEBHOOK_ERROR
            self.db.commit()
            raise

    def _create_ac_issue_type(self, connection: Connection):
        """Create 'AC' issue type in Jira if it doesn't exist"""
        connection.sync_status = "Creating AC issue type..."
        self.db.add(connection)
        self.db.commit()
        try:
            issue_type_id = self._exec_refreshing_access_token(
                connection=connection,
                func=JiraClient.create_issue_type,
                cloud_id=connection.id_,
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
                    cloud_id=connection.id_,
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
