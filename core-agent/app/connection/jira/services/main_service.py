from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from utils.markdown_adf_bridge.markdown_adf_bridge import md_to_adf, adf_to_md
from utils.security_utils import encrypt_token
from common.configs import JiraConfig
from common.schemas import Platform
from common.database import uuid_generator
from app.connection.models import Connection
from .base_service import JiraBaseService
from ..client import JiraClient
from ..models import JiraConnection, JiraProject, JiraStory, GherkinAC
from ..schemas import (
    ConnectionSyncStatusDto,
    ProjectDto,
    StoryDto,
    CreateIssuesRequest,
    StorySummary,
    UpdateStoryRequest,
    IssueUpdate,
    Issue,
    JiraConnectionDto,
    CreateStoryRequest,
    WebhookCallbackPayload,
)
from ..tasks import execute_update_connection


class JiraService(JiraBaseService):
    def __init__(self, db: Session):
        super().__init__(db)

    def save_connection(self, user_id: str, code: str):
        exchange_resp = JiraClient.exchange_authorization_code(
            client_id=JiraConfig.CLIENT_ID,
            client_secret=JiraConfig.CLIENT_SECRET,
            code=code,
            redirect_uri=JiraConfig.OAUTH_URL,
        )

        encryped_token, token_iv = encrypt_token(exchange_resp.access_token)

        refresh_encrypted_token, refresh_token_iv = encrypt_token(
            exchange_resp.refresh_token
        )

        cloud_info = JiraClient.get_cloud_info(access_token=exchange_resp.access_token)[
            0
        ]

        existing_connection = (
            self.db.query(JiraConnection)
            .filter(
                JiraConnection.user_id == user_id,
                JiraConnection.cloud_id == cloud_info.id,
            )
            .first()
        )
        if existing_connection:
            # Update existing connection
            existing_connection.token = encryped_token
            existing_connection.token_iv = token_iv
            existing_connection.refresh_token = refresh_encrypted_token
            existing_connection.refresh_token_iv = refresh_token_iv
            existing_connection.name = cloud_info.name
            existing_connection.url = cloud_info.url
            existing_connection.scopes = (
                " ".join(cloud_info.scopes) if cloud_info.scopes else None
            )
            existing_connection.avatar_url = cloud_info.avatarUrl

            self.db.add(existing_connection)
            self.db.commit()

            execute_update_connection(connection_id=existing_connection.id, new=False)
            return 2

        jira_conn_id = uuid_generator()

        jira_connection = JiraConnection(
            id=jira_conn_id,
            token=encryped_token,
            token_iv=token_iv,
            refresh_token=refresh_encrypted_token,
            refresh_token_iv=refresh_token_iv,
            user_id=user_id,
            cloud_id=cloud_info.id,
            name=cloud_info.name,
            url=cloud_info.url,
            scopes=" ".join(cloud_info.scopes) if cloud_info.scopes else None,
            avatar_url=cloud_info.avatarUrl,
        )

        connection = Connection(
            platform=Platform.JIRA,
            platform_connection_id=jira_conn_id,
        )
        self.db.add_all([jira_connection, connection])
        self.db.commit()

        execute_update_connection(connection_id=jira_conn_id, new=True)

        return 1

    def __get_connection_and_project(self, connection_id: str, project_key: str):
        connection_and_project = (
            self.db.query(JiraConnection, JiraProject)
            .join(JiraProject, JiraProject.jira_connection_id == JiraConnection.id)
            .filter(
                JiraConnection.id == connection_id,
                JiraProject.key == project_key,
            )
            .first()
        )

        if not connection_and_project:
            raise ValueError("Connection or Project not found")
        connection, project = connection_and_project

        return connection, project

    def get_connection_sync_status(
        self, user_id: str, connection_id_or_name: str
    ) -> str:
        connection = (
            self.db.query(JiraConnection)
            .filter(
                JiraConnection.user_id == user_id,
                (JiraConnection.id == connection_id_or_name)
                | (JiraConnection.name == connection_id_or_name),
            )
            .first()
        )

        if not connection:
            raise ValueError("Connection not found")

        return ConnectionSyncStatusDto(
            sync_status=connection.sync_status,
            sync_error=connection.sync_error.value if connection.sync_error else None,
        )

    def create_issues(self, connection_id: str, issues: List[IssueUpdate]) -> list[str]:
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")
        payload = CreateIssuesRequest(issueUpdates=issues)

        return self._exec_refreshing_access_token(
            connection,
            JiraClient.create_issues,
            cloud_id=connection.cloud_id,
            payload=payload,
        )

    def create_stories(
        self, connection_id: str, project_key: str, stories: List[CreateStoryRequest]
    ):

        connection, project = self.__get_connection_and_project(
            connection_id, project_key
        )

        payload = CreateIssuesRequest(
            issueUpdates=[
                IssueUpdate(
                    **{
                        "fields": {
                            "project": {"key": project_key},
                            "summary": story.summary,
                            "description": md_to_adf(story.description),
                            "issuetype": {"name": "Story"},
                        }
                    }
                )
                for story in stories
            ]
        )

        created_keys = self._exec_refreshing_access_token(
            connection,
            JiraClient.create_issues,
            cloud_id=connection.cloud_id,
            payload=payload,
        )

        if created_keys:
            self.__on_stories_create(connection, project, created_keys)

        return created_keys

    def create_story(
        self, connection_id: str, project_key: str, story: CreateStoryRequest
    ):
        connection, project = self.__get_connection_and_project(
            connection_id, project_key
        )

        payload = IssueUpdate(
            **{
                "fields": {
                    "project": {"key": project_key},
                    "summary": story.summary,
                    "description": md_to_adf(story.description),
                    "issuetype": {"name": "Story"},
                }
            }
        )

        story_key = self._exec_refreshing_access_token(
            connection,
            JiraClient.create_issue,
            cloud_id=connection.cloud_id,
            payload=payload,
        )

        # Update local data, vector store, and Jira
        self.__on_stories_create(connection, project, [story_key])
        return story_key

    def fetch_stories(
        self,
        connection_id: str,
        project_key: str,
        story_keys: List[str] | None = None,
        max_results: int | None = None,
        local: bool = True,
    ) -> List[StoryDto]:
        """Fetch story issues from local cache or Jira for a specific project

        Args:
            connection_id (str): Jira connection ID
            project_key (str): The project key to fetch stories from
            story_keys (List[str], optional): Specific issue keys to fetch. Defaults to None.
            max_results (int, optional): Maximum number of results to fetch. Defaults to None.
            local (bool): Fetch from local cache (True) or from Jira (False). Defaults to True.
        Returns:
            List[StoryDto]: List of fetched story issues
        """
        if local:
            _, project = self.__get_connection_and_project(connection_id, project_key)

            # Get stories
            query = self.db.query(JiraStory).filter(
                JiraStory.jira_project_id == project.id
            )

            if story_keys:
                query = query.filter(JiraStory.key.in_(story_keys))

            if max_results:
                query = query.limit(max_results)

            stories = query.all()

            return [
                StoryDto(
                    id=story.id,
                    key=story.key,
                    summary=story.summary,
                    description=story.description,
                )
                for story in stories
            ]

        # Fetch from Jira
        issues = self.fetch_issues(
            connection_id=connection_id,
            jql=f'project = "{project_key}" AND issuetype = Story'
            + (f' AND key IN ({", ".join(story_keys)})' if story_keys else ""),
            fields=["summary", "description", "priority"],
            max_results=max_results,
            expand_rendered_fields=False,
            local=False,
        )

        return [
            StoryDto(
                id=issue.id,
                key=issue.key,
                summary=issue.fields.summary,
                description=(
                    adf_to_md(issue.fields.description)
                    if issue.fields.description
                    else None
                ),
            )
            for issue in issues
        ]

    def fetch_issue(
        self,
        connection_id: str,
        issue_key: str,
        fields: List[str],
        expand_rendered_fields: bool = False,
        local: bool = True,
    ) -> Issue:
        """Fetch a single issue from local cache or Jira

        Args:
            connection_id (str): Jira connection ID
            issue_key (str): The issue key to fetch
            fields (List[str]): List of fields to fetch
            expand_rendered_fields (bool): Whether to expand rendered fields
            local (bool): Fetch from local cache (True) or from Jira (False). Defaults to True.
        Returns:
            Issue: The fetched issue
        """
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        if local:
            # Fetch from local database
            story = (
                self.db.query(JiraStory)
                .join(JiraProject)
                .filter(
                    JiraProject.jira_connection_id == connection_id,
                    JiraStory.key == issue_key,
                )
                .first()
            )
            if story:
                # Convert to Issue object for consistency
                return Issue(
                    id=story.id,
                    key=story.key,
                    fields={
                        "summary": story.summary,
                        "description": story.description,
                    },
                )
            return None

        response = self._exec_refreshing_access_token(
            connection,
            JiraClient.get_issue,
            cloud_id=connection.cloud_id,
            issue_key=issue_key,
            fields=fields,
            expand_rendered_fields=expand_rendered_fields,
        )
        return response

    def update_issue(
        self,
        connection_id: str,
        project_key: str,
        issue_key: str,
        summary: Optional[str] = None,
        description: Optional[str] = None,
    ):
        connection, project = self.__get_connection_and_project(
            connection_id, project_key
        )

        self._exec_refreshing_access_token(
            connection,
            JiraClient.update_issue,
            cloud_id=connection.cloud_id,
            issue_key=issue_key,
            summary=summary,
            description=md_to_adf(description) if description else None,
        )

        if project:
            # Update local data and vector store
            self.__on_stories_update(connection, project, [issue_key])

    def update_stories(
        self,
        connection_id: str,
        project_key: str,
        story_updates: List[UpdateStoryRequest],
    ):
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        for story_update in story_updates:
            self._exec_refreshing_access_token(
                connection,
                JiraClient.update_issue,
                cloud_id=connection.cloud_id,
                issue_key=story_update.key,
                summary=story_update.summary,
                description=(
                    md_to_adf(story_update.description)
                    if story_update.description
                    else None
                ),
            )

        # Update local data and vector store
        self.__on_stories_update(
            connection, project_key, [su.key for su in story_updates]
        )

    def delete_story(self, connection_id: str, project_key: str, story_key: str):
        connection, project = self.__get_connection_and_project(
            connection_id, project_key
        )

        self._exec_refreshing_access_token(
            connection,
            JiraClient.delete_issue,
            cloud_id=connection.cloud_id,
            issue_key=story_key,
        )

        self.__on_stories_delete(connection, project, [story_key])

    def get_project_settings(
        self,
        connection_id: str,
        project_key: str,
        setting_key: str,
    ) -> dict:
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        response = self._exec_refreshing_access_token(
            connection,
            JiraClient.get_project_settings,
            cloud_id=connection.cloud_id,
            project_key=project_key,
            setting_key=setting_key,
        )
        return response

    def get_connection(self, connection_id: str) -> JiraConnectionDto:
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        return JiraConnectionDto(
            id=connection.id,
            cloud_id=connection.cloud_id,
            name=connection.name,
            url=connection.url,
            avatar_url=connection.avatar_url,
        )

    def list_user_connections(self, user_id: str) -> List[JiraConnectionDto]:
        connections = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.user_id == user_id)
            .all()
        )

        return [
            JiraConnectionDto(
                id=conn.id,
                cloud_id=conn.cloud_id,
                name=conn.name,
                url=conn.url,
                avatar_url=conn.avatar_url,
            )
            for conn in connections
        ]

    def delete_connection(self, connection_id: str):
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        self.db.delete(connection)
        self.db.commit()

    def fetch_project_dtos(
        self, user_id: str, connection_id_or_name: str, local: bool = True
    ) -> List[ProjectDto]:
        """Fetch all project keys from Jira

        Args:
            db (Session): Database session
            connection_id (str): Jira connection ID
        Returns:
            List[str]: List of project keys
        """
        connection = (
            self.db.query(JiraConnection)
            .filter(
                JiraConnection.user_id == user_id,
                (JiraConnection.id == connection_id_or_name)
                | (JiraConnection.name == connection_id_or_name),
            )
            .first()
        )

        if not connection:
            raise ValueError("Connection not found")

        if local:
            if not connection:
                raise ValueError("Connection not found")

            projects = (
                self.db.query(JiraProject)
                .filter(JiraProject.jira_connection_id == connection.id)
                .all()
            )
            return [
                ProjectDto(
                    id=prod.id, key=prod.key, name=prod.name, avatar_url=prod.avatar_url
                )
                for prod in projects
            ]

        return self._exec_refreshing_access_token(
            connection,
            JiraClient.fetch_projects,
            cloud_id=connection.cloud_id,
        )

    def fetch_story_summaries(
        self, connection_id: str, project_key: str, local: bool = True
    ) -> List[StorySummary]:
        """Fetch all story issue keys for a specific project

        Args:
            db (Session): Database session
            connection_id (str): Jira connection ID
            project_key (str): The project key to fetch stories from
        Returns:
            List[str]: List of story issue keys
        """
        connection, project = self.__get_connection_and_project(
            connection_id, project_key
        )

        if local:

            stories = (
                self.db.query(JiraStory)
                .filter(JiraStory.jira_project_id == project.id)
                .all()
            )
            return [
                StorySummary(id=story.id, key=story.key, summary=story.summary)
                for story in stories
            ]

        return [
            StorySummary(id=dto.id, key=dto.key, summary=dto.summary)
            for dto in self.fetch_stories(
                connection_id=connection.id,
                project_key=project_key,
                local=False,
            )
        ]

    def _on_stories_create(
        self, connection_id: str, project_key: str, story_keys: List[str]
    ):
        """Handle story creation: save to local DB and vector store"""
        connection, project = self.__get_connection_and_project(
            connection_id, project_key
        )

        self.__on_stories_create(
            connection=connection, project=project, story_keys=story_keys
        )

    def __on_stories_create(
        self, connection: JiraConnection, project: JiraProject, story_keys: List[str]
    ):
        print("Creating stories:", story_keys)
        try:
            to_vector: list[StoryDto] = []

            stories = self.fetch_stories(
                connection_id=connection.id,
                project_key=project.key,
                story_keys=story_keys,
                local=False,
            )

            for story in stories:
                jira_story = JiraStory(
                    id=story.id,
                    key=story.key,
                    summary=story.summary,
                    description=story.description,
                    jira_project_id=project.id,
                )
                self.db.add(jira_story)

                to_vector.append(story)

            self.db.commit()

            self.vector_store.add_stories(
                connection_id=connection.id,
                project_key=project.key,
                stories=to_vector,
            )

        except Exception as e:
            self.db.rollback()
            print(f"Error creating story: {e}")
            raise

    def _on_stories_update(
        self, connection_id: str, project_key: str, story_keys: List[str]
    ):
        """Handle story update: update local DB and vector store"""
        connection, project = self.__get_connection_and_project(
            connection_id, project_key
        )

        self.__on_stories_update(
            connection=connection, project=project, story_keys=story_keys
        )

    def __on_stories_update(
        self, connection: JiraConnection, project: JiraProject, story_keys: List[str]
    ):
        print("Updating stories:", story_keys)
        try:
            stories = (
                self.db.query(JiraStory)
                .join(JiraProject)
                .filter(
                    JiraProject.jira_connection_id == connection.id,
                    JiraProject.key == project.key,
                    JiraStory.key.in_(story_keys),
                )
                .all()
            )
            if not stories:
                return

            to_vector: list[StoryDto] = []

            fetched_stories = self.fetch_stories(
                connection_id=connection.id,
                project_key=project.key,
                story_keys=[story.key for story in stories],
                local=False,
            )
            fetched_stories_dict = {story.key: story for story in fetched_stories}

            for story in stories:
                updated_story = fetched_stories_dict.get(story.key)
                if updated_story:
                    story.summary = updated_story.summary
                    story.description = updated_story.description
                    to_vector.append(updated_story)

            self.db.commit()

            self.vector_store.update_stories(
                connection_id=connection.id,
                project_key=project.key,
                stories=to_vector,
            )

        except Exception as e:
            self.db.rollback()
            print(f"Error updating story: {e}")
            raise

    def _on_stories_delete(
        self, connection_id: str, project_key: str, story_keys: List[str]
    ):
        """Handle story deletion: remove from local DB and vector store"""
        connection, project = self.__get_connection_and_project(
            connection_id, project_key
        )
        self.__on_stories_delete(
            connection=connection, project=project, story_keys=story_keys
        )

    def __on_stories_delete(
        self, connection: JiraConnection, project: JiraProject, story_keys: List[str]
    ):
        print("Deleting stories:", story_keys)
        try:
            # Get the story from local DB
            stories = (
                self.db.query(JiraStory)
                .join(JiraProject)
                .filter(
                    JiraProject.jira_connection_id == connection.id,
                    JiraProject.key == project.key,
                    or_(
                        JiraStory.key.in_(story_keys),
                        JiraStory.id.in_(story_keys),
                    ),
                )
                .all()
            )

            ids_to_delete = []
            for story in stories:
                self.db.delete(story)
                ids_to_delete.append(story.id)
            self.db.commit()

            self.vector_store.remove_stories(
                connection_id=connection.id,
                project_key=project.key,
                story_ids=ids_to_delete,
            )

        except Exception as e:
            self.db.rollback()
            print(f"Error deleting story: {e}")
            raise

    def delete_connection(self, user_id: str, connection_id: str):
        jira_connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not jira_connection:
            raise ValueError("Connection not found")

        if jira_connection.user_id != user_id:
            raise PermissionError(
                "User does not have permission to delete this connection"
            )

        self.db.delete(jira_connection)

        connection = (
            self.db.query(Connection)
            .filter(Connection.platform_connection_id == connection_id)
            .first()
        )

        self.db.delete(connection)

        self.db.commit()

    def handle_webhook(
        self,
        connection_id: str,
        payload: WebhookCallbackPayload,
    ):
        """Handle incoming Jira webhook payloads"""
        print("Received webhook payload:", payload)
        project_key = payload.issue.fields.project.key
        if payload.issue.fields.issuetype.name == "Story":
            match payload.webhookEvent:
                case "jira:issue_created":
                    self._on_stories_create(
                        connection_id=connection_id,
                        project_key=project_key,
                        story_keys=[payload.issue.key],
                    )
                case "jira:issue_updated":
                    self._on_stories_update(
                        connection_id=connection_id,
                        project_key=project_key,
                        story_keys=[payload.issue.key],
                    )
                case "jira:issue_deleted":
                    self._on_stories_delete(
                        connection_id=connection_id,
                        project_key=project_key,
                        story_keys=[payload.issue.key],
                    )
        else:
            match payload.webhookEvent:
                case "jira:issue_created":
                    self._on_ac_create(
                        connection_id=connection_id,
                        project_key=project_key,
                        story_id=payload.issue.fields.parent.id,
                        ac_id=payload.issue.id,
                        summary=payload.issue.fields.summary,
                        description=(
                            adf_to_md(payload.issue.fields.description)
                            if payload.issue.fields.description
                            else None
                        ),
                    )
                case "jira:issue_updated":
                    self._on_ac_update(
                        connection_id=connection_id,
                        project_key=project_key,
                        story_id=payload.issue.fields.parent.id,
                        ac_id=payload.issue.id,
                        summary=payload.issue.fields.summary,
                        description=(
                            adf_to_md(payload.issue.fields.description)
                            if payload.issue.fields.description
                            else None
                        ),
                    )
                case "jira:issue_deleted":
                    self._on_ac_delete(
                        connection_id=connection_id,
                        project_key=project_key,
                        story_id=payload.issue.fields.parent.id,
                        ac_id=payload.issue.id,
                    )

    def get_webhooks(self, connection_id: str):
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        response = self._exec_refreshing_access_token(
            connection,
            JiraClient.get_webhooks,
            cloud_id=connection.cloud_id,
        )
        return response

    def delete_webhook(self, connection_id: str, webhook_id: str):
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        self._exec_refreshing_access_token(
            connection,
            JiraClient.delete_webhooks,
            cloud_id=connection.cloud_id,
            webhook_ids=[webhook_id],
        )

    def _on_ac_create(
        self,
        connection_id: str,
        project_key: str,
        story_id: str,
        ac_id: str,
        summary: str,
        description: str,
    ):
        """Handle AC creation: save to local DB and vector store"""
        ac = GherkinAC(
            id=ac_id,
            summary=summary,
            description=description,
            jira_story_id=story_id,
        )
        self.db.add(ac)
        self.db.commit()

    def _on_ac_update(
        self,
        connection_id: str,
        project_key: str,
        story_id: str,
        ac_id: str,
        summary: str,
        description: str,
    ):
        """Handle AC creation: save to local DB and vector store"""
        ac = (
            self.db.query(GherkinAC)
            .filter(
                GherkinAC.id == ac_id,
            )
            .first()
        )

        ac.summary = summary
        ac.description = description
        self.db.commit()

    def _on_ac_delete(
        self,
        connection_id: str,
        project_key: str,
        story_id: str,
        ac_id: str,
    ):
        """Handle AC deletion: remove from local DB and vector store"""
        ac = (
            self.db.query(GherkinAC)
            .join(JiraStory, GherkinAC.jira_story_id == JiraStory.id)
            .join(JiraProject, JiraStory.jira_project_id == JiraProject.id)
            .join(JiraConnection, JiraProject.jira_connection_id == JiraConnection.id)
            .filter(
                JiraConnection.id == connection_id,
                JiraProject.key == project_key,
                JiraStory.id == story_id,
                GherkinAC.id == ac_id,
            )
            .first()
        )

        self.db.delete(ac)
        self.db.commit()
