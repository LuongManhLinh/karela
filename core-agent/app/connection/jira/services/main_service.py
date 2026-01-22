from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from utils.markdown_adf_bridge.markdown_adf_bridge import md_to_adf, adf_to_md
from utils.security_utils import encrypt_token
from common.configs import JiraConfig
from common.database import uuid_generator
from .base_service import JiraBaseService
from ..client import JiraClient
from ..models import Connection, Project, Story, GherkinAC
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
            self.db.query(Connection)
            .filter(
                Connection.user_id == user_id,
                Connection.id_ == cloud_info.id,
            )
            .first()
        )

        new = True
        jira_conn_id = uuid_generator()

        if existing_connection:
            jira_conn_id = existing_connection.id
            new = False
            self.delete_connection(user_id=user_id, connection_id=jira_conn_id)

        jira_connection = Connection(
            id=jira_conn_id,
            token=encryped_token,
            token_iv=token_iv,
            refresh_token=refresh_encrypted_token,
            refresh_token_iv=refresh_token_iv,
            user_id=user_id,
            id_=cloud_info.id,
            name=cloud_info.name,
            url=cloud_info.url,
            scopes=" ".join(cloud_info.scopes) if cloud_info.scopes else None,
            avatar_url=cloud_info.avatarUrl,
        )

        self.db.add(jira_connection)
        self.db.commit()

        execute_update_connection(connection_id=jira_conn_id, new=new)

        return 1 if new else 2

    def __get_connection_and_project(self, connection_id: str, project_key: str):
        connection_and_project = (
            self.db.query(Connection, Project)
            .join(Project, Project.connection_id == Connection.id)
            .filter(
                Connection.id == connection_id,
                Project.key == project_key,
            )
            .first()
        )

        if not connection_and_project:
            raise ValueError("Connection or Project not found")
        connection, project = connection_and_project

        return connection, project

    def get_connection_sync_status(self, user_id: str, connection_id: str) -> str:
        connection = (
            self.db.query(Connection)
            .filter(
                Connection.user_id == user_id,
                Connection.id == connection_id,
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
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")
        payload = CreateIssuesRequest(issueUpdates=issues)

        return self._exec_refreshing_access_token(
            connection,
            JiraClient.create_issues,
            cloud_id=connection.id_,
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
            cloud_id=connection.id_,
            payload=payload,
        )

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
            cloud_id=connection.id_,
            payload=payload,
        )

        return story_key

    def fetch_stories(
        self,
        user_id: str,
        connection_name: str,
        project_key: str,
        story_keys: List[str] | None = None,
        max_results: int | None = None,
        local: bool = True,
    ) -> List[StoryDto]:
        """Fetch story issues from local cache or Jira for a specific project

        Args:
            user_id (str): The ID of the user owning the connection
            connection_id (str): Jira connection ID
            project_key (str): The project key to fetch stories from
            story_keys (List[str], optional): Specific issue keys to fetch. Defaults to None.
            max_results (int, optional): Maximum number of results to fetch. Defaults to None.
            local (bool): Fetch from local cache (True) or from Jira (False). Defaults to True.
        Returns:
            List[StoryDto]: List of fetched story issues
        """
        if local:
            query = (
                self.db.query(Story)
                .join(Project)
                .join(Connection)
                .filter(
                    Connection.user_id == user_id,
                    Connection.name == connection_name,
                    Project.key == project_key,
                )
            )

            if story_keys:
                query = query.filter(Story.key.in_(story_keys))

            if max_results:
                query = query.limit(max_results)

            stories = query.all()

            return [
                StoryDto(
                    id=story.id_,
                    key=story.key,
                    summary=story.summary,
                    description=story.description,
                )
                for story in stories
            ]

        # Fetch from Jira
        issues = self.fetch_issues(
            connection_id=connection_name,
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
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        if local:
            # Fetch from local database
            story = (
                self.db.query(Story)
                .join(Project)
                .filter(
                    Project.connection_id == connection_id,
                    Story.key == issue_key,
                )
                .first()
            )
            if story:
                # Convert to Issue object for consistency
                return Issue(
                    id=story.id_,
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
            cloud_id=connection.id_,
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
            cloud_id=connection.id_,
            issue_key=issue_key,
            summary=summary,
            description=md_to_adf(description) if description else None,
        )

    def update_stories(
        self,
        connection_id: str,
        project_key: str,
        story_updates: List[UpdateStoryRequest],
    ):
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        for story_update in story_updates:
            self._exec_refreshing_access_token(
                connection,
                JiraClient.update_issue,
                cloud_id=connection.id_,
                issue_key=story_update.key,
                summary=story_update.summary,
                description=(
                    md_to_adf(story_update.description)
                    if story_update.description
                    else None
                ),
            )

    def delete_issue(self, connection_id: str, project_key: str, issue_key: str):
        connection, project = self.__get_connection_and_project(
            connection_id, project_key
        )

        self._exec_refreshing_access_token(
            connection,
            JiraClient.delete_issue,
            cloud_id=connection.id_,
            issue_key=issue_key,
        )

    def get_project_settings(
        self,
        connection_id: str,
        project_key: str,
        setting_key: str,
    ) -> dict:
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        response = self._exec_refreshing_access_token(
            connection,
            JiraClient.get_project_settings,
            cloud_id=connection.id_,
            project_key=project_key,
            setting_key=setting_key,
        )
        return response

    def get_connection(self, connection_id: str) -> JiraConnectionDto:
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        return JiraConnectionDto(
            id=connection.id,
            cloud_id=connection.id_,
            name=connection.name,
            url=connection.url,
            avatar_url=connection.avatar_url,
        )

    def list_user_connections(self, user_id: str) -> List[JiraConnectionDto]:
        connections = (
            self.db.query(Connection).filter(Connection.user_id == user_id).all()
        )

        return [
            JiraConnectionDto(
                id=conn.id,
                cloud_id=conn.id_,
                name=conn.name,
                url=conn.url,
                avatar_url=conn.avatar_url,
            )
            for conn in connections
        ]

    def fetch_project_dtos(
        self, user_id: str, connection_name: str, local: bool = True
    ) -> List[ProjectDto]:
        """Fetch all project keys from Jira

        Args:
            db (Session): Database session
            connection_id (str): Jira connection ID
        Returns:
            List[str]: List of project keys
        """
        connection = (
            self.db.query(Connection)
            .filter(
                Connection.user_id == user_id,
                Connection.name == connection_name,
            )
            .first()
        )

        if not connection:
            raise ValueError("Connection not found")

        if local:
            if not connection:
                raise ValueError("Connection not found")

            projects = (
                self.db.query(Project)
                .filter(Project.connection_id == connection.id)
                .all()
            )
            return [
                ProjectDto(
                    id=prod.id_,
                    key=prod.key,
                    name=prod.name,
                    avatar_url=prod.avatar_url,
                )
                for prod in projects
            ]

        return self._exec_refreshing_access_token(
            connection,
            JiraClient.fetch_projects,
            cloud_id=connection.id_,
        )

    def fetch_story_summaries(
        self,
        user_id: str,
        connection_name: str,
        project_key: str,
        local: bool = True,
    ) -> List[StorySummary]:
        """Fetch all story issue keys for a specific project

        Args:
            db (Session): Database session
            connection_id (str): Jira connection ID
            project_key (str): The project key to fetch stories from
        Returns:
            List[str]: List of story issue keys
        """
        conn_proj = (
            self.db.query(Connection, Project)
            .join(Project)
            .filter(
                Connection.user_id == user_id,
                Connection.name == connection_name,
                Project.key == project_key,
            )
            .first()
        )
        if not conn_proj:
            raise ValueError("Connection or Project not found")

        connection, project = conn_proj

        if local:
            stories = (
                self.db.query(Story)
                .filter(Story.project_id == project.id)
                .order_by(Story.key)
                .all()
            )
            return [
                StorySummary(id=story.id_, key=story.key, summary=story.summary)
                for story in stories
            ]

        return [
            StorySummary(id=dto.id, key=dto.key, summary=dto.summary)
            for dto in self.fetch_stories(
                connection_name=connection.id,
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
        self, connection: Connection, project: Project, story_keys: List[str]
    ):
        try:
            to_vector: list[StoryDto] = []

            stories = self.fetch_stories(
                connection_name=connection.id,
                project_key=project.key,
                story_keys=story_keys,
                local=False,
            )

            for story in stories:
                jira_story = Story(
                    id_=story.id,
                    key=story.key,
                    summary=story.summary,
                    description=story.description,
                    project_id=project.id,
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
        self, connection: Connection, project: Project, story_keys: List[str]
    ):
        print("Updating stories:", story_keys)
        try:
            stories = (
                self.db.query(Story)
                .join(Project)
                .filter(
                    Project.connection_id == connection.id,
                    Project.key == project.key,
                    Story.key.in_(story_keys),
                )
                .all()
            )
            if not stories:
                return

            to_vector: list[StoryDto] = []

            fetched_stories = self.fetch_stories(
                connection_name=connection.id,
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
        self, connection: Connection, project: Project, story_keys: List[str]
    ):
        print("Deleting stories:", story_keys)
        try:
            # Get the story from local DB
            stories = (
                self.db.query(Story)
                .join(Project)
                .filter(
                    Project.connection_id == connection.id,
                    Project.key == project.key,
                    Story.key.in_(story_keys),
                )
                .all()
            )

            ids_to_delete = []
            for story in stories:
                self.db.delete(story)
                ids_to_delete.append(story.id_)
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
        """
        Delete a Jira connection and all associated data

        Args:
            user_id (str): The ID of the user owning the connection
            connection_id (str): The ID of the Jira connection to delete
        """
        connection = (
            self.db.query(Connection)
            .filter(Connection.id == connection_id, Connection.user_id == user_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        self.db.delete(connection)

        # Query all stories and remove from vector store
        projects_stories = (
            self.db.query(Project.key, Story.id)
            .join(Story, Story.project_id == Project.id)
            .filter(Project.connection_id == connection.id)
            .all()
        )

        proj_to_story_ids = {}
        for project_key, story_id in projects_stories:
            if project_key not in proj_to_story_ids:
                proj_to_story_ids[project_key] = []
            proj_to_story_ids[project_key].append(story_id)

        for project_key, story_ids in proj_to_story_ids.items():
            self.vector_store.remove_stories(
                connection_id=connection.id,
                project_key=project_key,
                story_ids=story_ids,
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
                        story_key=payload.issue.fields.parent.key,
                        ac_id_=payload.issue.id,
                        ac_key=payload.issue.key,
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
                        story_key=payload.issue.fields.parent.key,
                        ac_key=payload.issue.key,
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
                        story_key=payload.issue.fields.parent.key,
                        ac_key=payload.issue.key,
                    )

    def get_webhooks(self, connection_id: str):
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        response = self._exec_refreshing_access_token(
            connection,
            JiraClient.get_webhooks,
            cloud_id=connection.id_,
        )
        return response

    def delete_webhook(self, connection_id: str, webhook_id: str):
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        self._exec_refreshing_access_token(
            connection,
            JiraClient.delete_webhooks,
            cloud_id=connection.id_,
            webhook_ids=[webhook_id],
        )

    def _on_ac_create(
        self,
        connection_id: str,
        project_key: str,
        story_key: str,
        ac_id_: str,
        ac_key: str,
        summary: str,
        description: str,
    ):
        """Handle AC creation: save to local DB and vector store"""
        story = (
            self.db.query(Story)
            .join(Project, Story.project_id == Project.id)
            .join(Connection, Project.connection_id == Connection.id)
            .filter(
                Connection.id == connection_id,
                Project.key == project_key,
                Story.key == story_key,
            )
            .first()
        )
        if not story:
            raise ValueError("Story not found")
        ac = GherkinAC(
            id_=ac_id_,
            key=ac_key,
            summary=summary,
            description=description,
            story_id=story.id,
        )
        self.db.add(ac)
        self.db.commit()

    def _on_ac_update(
        self,
        connection_id: str,
        project_key: str,
        story_key: str,
        ac_key: str,
        summary: str,
        description: str,
    ):
        """Handle AC creation: save to local DB and vector store"""
        ac = (
            self.db.query(GherkinAC)
            .join(Story, GherkinAC.story_id == Story.id)
            .join(Project, Story.project_id == Project.id)
            .join(Connection, Project.connection_id == Connection.id)
            .filter(
                Connection.id == connection_id,
                Project.key == project_key,
                Story.key == story_key,
                GherkinAC.key == ac_key,
            )
            .first()
        )
        if not ac:
            raise ValueError("AC not found")

        ac.summary = summary
        ac.description = description
        self.db.commit()

    def _on_ac_delete(
        self,
        connection_id: str,
        project_key: str,
        story_key: str,
        ac_key: str,
    ):
        """Handle AC deletion: remove from local DB and vector store"""
        ac = (
            self.db.query(GherkinAC)
            .join(Story, GherkinAC.story_id == Story.id)
            .join(Project, Story.project_id == Project.id)
            .join(Connection, Project.connection_id == Connection.id)
            .filter(
                Connection.id == connection_id,
                Project.key == project_key,
                Story.key == story_key,
                GherkinAC.key == ac_key,
            )
            .first()
        )

        if not ac:
            raise ValueError("AC not found")

        self.db.delete(ac)
        self.db.commit()
