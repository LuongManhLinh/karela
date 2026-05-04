from sqlalchemy.orm import Session
import json
from app.connection.jira.services.base_service import (
    AC_ISSUE_TYPE_DESCRIPTION,
    AC_ISSUE_TYPE_LEVEL,
    AC_ISSUE_TYPE_NAME,
    AI_TRANSACTION_ID_FIELD_DESCRIPTION,
    AI_TRANSACTION_ID_FIELD_NAME,
)
from common.database import uuid_generator
from utils.markdown_adf_bridge.markdown_adf_bridge import adf_to_md
from common.configs import JiraConfig
from .base_service import JiraBaseService
from ..client import JiraClient
from ..models import GherkinAC, Connection, Project, Story, SyncError, SyncStatus
from ..schemas import (
    StoryDto,
)

from utils.security_utils import decrypt_token
from common.redis_app import redis_client

# from app.xgraphrag import index_user_stories


class JiraSyncService(JiraBaseService):
    def __init__(self, db: Session):
        super().__init__(db)
        self.redis_client = redis_client

    def _publish_status(
        self,
        connection: Connection,
        status: SyncStatus = None,
        message: str = None,
        error: SyncError = None,
    ):
        if status:
            connection.sync_status = status
        if message:
            connection.sync_message = message
        if error:
            connection.sync_error = error
        try:
            payload = {}
            if status:
                payload["sync_status"] = connection.sync_status.value
            if message:
                payload["sync_message"] = connection.sync_message
            if error:
                payload["sync_error"] = error if isinstance(error, str) else error.value
            self.redis_client.publish(
                f"connection:{connection.id}", json.dumps(payload)
            )
        except Exception as e:
            print(f"Failed to publish connection update: {e}")
        self.db.commit()

    def setup_new_connection(self, connection_id: str):
        print("Setting up new connection with ID:", connection_id)
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")
        self._publish_status(connection, status=SyncStatus.SETTING_UP)
        try:
            issue_type_id = self._create_ac_issue_type(connection)
            self._update_issue_type_for_connection(connection, issue_type_id)
            self._register_webhooks(connection)
            field_id = self.create_custom_ai_transaction_id_field(connection)
            connection.ai_transaction_id_field_id = field_id
            self._publish_status(
                connection,
                status=SyncStatus.SETUP_DONE,
                message="Connection setup completed",
            )

        except Exception as e:
            print(f"Error setting up connection: {e}")
            self._publish_status(
                connection,
                status=SyncStatus.SETUP_FAILED,
                message=f"Connection setup failed: {e}",
            )
        self.db.commit()

    def sync_projects(
        self,
        connection_id: str,
        project_keys: list[str],
        project_context_map: dict[str, str],
    ):
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        self._sync_projects(
            connection,
            project_keys=project_keys,
            project_context_map=project_context_map,
        )
        self._publish_status(
            connection, status=SyncStatus.DONE, message="Sync completed"
        )

    def _sync_projects(
        self,
        connection: Connection,
        project_keys: list[str],
        project_context_map: dict[str, str],
    ):
        """Fetch projects and stories from Jira and cache them locally, including vector store"""
        self.db.add(connection)
        connection.sync_error = None
        self._publish_status(
            connection, status=SyncStatus.IN_PROGRESS, message="Starting sync..."
        )

        try:
            # Fetch all projects from Jira
            print("Fetching projects from Jira...")
            projects_data = self._exec_refreshing_access_token(
                connection,
                JiraClient.fetch_projects,
                cloud_id=connection.id,
                project_keys=project_keys,
            )

            # Get access token once for all concurrent operations
            # This also ensures token is refreshed if needed before concurrent work
            access_token = self._get_valid_access_token(connection)
            cloud_id = connection.id

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

            for project_data in projects_data:
                self._publish_status(
                    connection,
                    message=f"Processing project {project_data.key}...",
                    status=SyncStatus.IN_PROGRESS,
                )
                project, stories, gherkin_acs, story_dtos = process_project(
                    project_data
                )

                project.synced = True
                project.description = project_context_map.get(project.key, "")
                self.db.add(project)
                self.db.add_all(stories)
                self.db.add_all(gherkin_acs)

                # Push this project's stories to vector store
                if story_dtos:
                    self._publish_status(
                        connection,
                        message=f"Indexing {len(story_dtos)} stories for project {project_data.key}...",
                        status=SyncStatus.IN_PROGRESS,
                    )

                    # index_user_stories(
                    #     connection_id=connection.id,
                    #     project_key=project.key,
                    #     user_stories=story_dtos,
                    # )

                    self.taxonomy_service.initialize_buckets(
                        connection_id=connection.id,
                        project_key=project.key,
                        stories=story_dtos,
                        project_description=project.description or "",
                    )

                    self.vector_store.add_stories(
                        connection_id=connection.id,
                        project_key=project.key,
                        stories=story_dtos,
                    )

            self._publish_status(
                connection, status=SyncStatus.DONE, message="Sync completed"
            )
            self.db.commit()

        except Exception as e:
            self.db.rollback()
            print(f"Error updating connection: {e}")
            self._publish_status(
                connection=connection,
                message=f"Sync failed: {e}",
                status=SyncStatus.FAILED,
                error=SyncError.DATA_SYNC_ERROR,
            )
            self.db.commit()
            raise

    def _get_valid_access_token(self, connection: Connection) -> str:
        """Get a valid access token, refreshing if necessary"""

        access_token = decrypt_token(connection.token, connection.token_iv)
        # Test the token with a simple API call
        try:
            JiraClient.fetch_projects(access_token=access_token, cloud_id=connection.id)
            return access_token
        except Exception as e:
            if "401" in str(e) or "400" in str(e):
                # Token expired, refresh it
                return self.__refresh_access_token(connection)
            raise

    def _update_issue_type_for_connection(
        self, connection: Connection, issue_type_id: str
    ):
        self._publish_status(connection, message="Updating issue types for projects...")
        try:
            self._exec_refreshing_access_token(
                connection=connection,
                func=JiraClient.add_issue_type_to_activated_schemes,
                cloud_id=connection.id,
                issue_type_id=issue_type_id,
            )
        except Exception as e:
            print(f"Error adding issue type to projects: {e}")
            self._publish_status(
                connection,
                message=f"Failed to update issue types: {e}",
                error=SyncError.ISSUE_TYPE_SCHEME_ERROR,
            )
            raise

    def _register_webhooks(self, connection: Connection):
        """Register webhooks for the Jira connection"""
        self._publish_status(connection, message="Registering webhooks...")
        print("Registering webhooks for connection:", connection.id)
        try:
            self._exec_refreshing_access_token(
                connection=connection,
                func=JiraClient.register_webhook,
                cloud_id=connection.id,
                url=f"{JiraConfig.WEBHOOK_URL}/{connection.id}",
                events=JiraConfig.WEBHOOK_EVENTS,
            )
        except Exception as e:
            print(f"Error registering webhooks: {e}")
            self._publish_status(
                connection,
                message=f"Failed to register webhooks: {e}",
                error=SyncError.WEBHOOK_ERROR,
            )
            raise

    def _create_ac_issue_type(self, connection: Connection):
        """Create 'AC' issue type in Jira if it doesn't exist"""
        self._publish_status(connection, message="Creating AC issue type...")
        try:
            issue_type_id = self._exec_refreshing_access_token(
                connection=connection,
                func=JiraClient.create_issue_type,
                cloud_id=connection.id,
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
                    cloud_id=connection.id,
                    name=AC_ISSUE_TYPE_NAME,
                )
                if issue_type_id is None:
                    self._publish_status(
                        connection,
                        message=f"Failed to retrieve existing {AC_ISSUE_TYPE_NAME} issue type ID",
                    )
                    raise ValueError(
                        f"Failed to retrieve existing {AC_ISSUE_TYPE_NAME} issue type ID"
                    )

                return issue_type_id
            else:
                self._publish_status(
                    connection,
                    message=f"Error creating {AC_ISSUE_TYPE_NAME} issue type: {e}",
                    error=SyncError.ISSUE_TYPE_ERROR,
                )
                self.db.commit()
                raise

    def create_custom_ai_transaction_id_field(self, connection: Connection):
        """Create custom field for AI transaction ID if it doesn't exist"""
        self._publish_status(
            connection,
            message=f"Creating custom field for {AI_TRANSACTION_ID_FIELD_NAME}...",
        )
        try:
            field_id = self._exec_refreshing_access_token(
                connection=connection,
                func=JiraClient.create_custom_field,
                cloud_id=connection.id,
                name=AI_TRANSACTION_ID_FIELD_NAME,
                description=AI_TRANSACTION_ID_FIELD_DESCRIPTION,
            )
            return field_id
        except Exception as e:
            if "409" in str(e):
                field_id = self._exec_refreshing_access_token(
                    connection=connection,
                    func=JiraClient.get_custom_field_by_name,
                    cloud_id=connection.id,
                    name=AI_TRANSACTION_ID_FIELD_NAME,
                )
                if field_id is None:
                    self._publish_status(
                        connection,
                        message=f"Failed to retrieve existing {AI_TRANSACTION_ID_FIELD_NAME} custom field ID",
                    )
                    raise ValueError(
                        f"Failed to retrieve existing {AI_TRANSACTION_ID_FIELD_NAME} custom field ID"
                    )

                return field_id
            else:
                self._publish_status(
                    connection,
                    message=f"Error creating {AI_TRANSACTION_ID_FIELD_NAME} custom field: {e}",
                    error=SyncError.CUSTOM_FIELD_ERROR,
                )
                raise
