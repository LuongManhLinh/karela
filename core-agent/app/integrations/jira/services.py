from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional

from utils.markdown_adf_bridge.markdown_adf_bridge import md_to_adf, adf_to_md
from utils.security_utils import encrypt_token, decrypt_token
from common.configs import JiraConfig
from common.schemas import Platform
from common.database import uuid_generator
from app.integrations.models import Connection
from .client import JiraClient
from .models import JiraConnection, JiraProject, JiraStory
from .schemas import (
    StoryDto,
    CreateIssuesRequest,
    IssueUpdate,
    Issue,
    JiraConnectionDto,
    CreateStoryRequest,
)


class JiraService:
    def __init__(self, db: Session):
        self.db = db

    def save_connection(self, user_id: str, code: str):
        exchange_resp = JiraClient.exchange_authorization_code(
            client_id=JiraConfig.CLIENT_ID,
            client_secret=JiraConfig.CLIENT_SECRET,
            code=code,
            redirect_uri=JiraConfig.REDIRECT_URI,
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

        return 1

    def _refresh_access_token(self, connection: JiraConnection):
        refresh_token = decrypt_token(
            connection.refresh_token, connection.refresh_token_iv
        )

        new_token = JiraClient.refresh_access_token(
            client_id=JiraConfig.CLIENT_ID,
            client_secret=JiraConfig.CLIENT_SECRET,
            refresh_token=refresh_token,
        )

        encrypted_token, token_iv = encrypt_token(new_token)
        connection.token = encrypted_token
        connection.token_iv = token_iv

        self.db.add(connection)
        self.db.commit()

        return new_token

    def _exec_refreshing_access_token(
        self,
        connection: JiraConnection,
        func,
        *args,
        **kwargs,
    ):
        try:
            access_token = decrypt_token(connection.token, connection.token_iv)
            return func(access_token=access_token, *args, **kwargs)
        except Exception as e:
            if "401" in str(e):
                access_token = self._refresh_access_token(connection)
                return func(access_token=access_token, *args, **kwargs)
            else:
                raise e

    def create_issues(self, connection_id: str, issues: List[IssueUpdate]):
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")
        payload = CreateIssuesRequest(issues=issues)

        return self._exec_refreshing_access_token(
            connection,
            JiraClient.create_issues,
            cloud_id=connection.cloud_id,
            payload=payload,
        )

    def create_stories(
        self, connection_id: str, project_key: str, stories: List[CreateStoryRequest]
    ):
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        project = (
            self.db.query(JiraProject)
            .filter(
                JiraProject.connection_id == connection.id,
                JiraProject.key == project_key,
            )
            .first()
        )
        if not project:
            raise ValueError("Project not found")

        payload = CreateIssuesRequest(
            issue_updates=[
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

        return self._exec_refreshing_access_token(
            connection,
            JiraClient.create_issues,
            cloud_id=connection.cloud_id,
            payload=payload,
        )

    def fetch_issues(
        self,
        connection_id: str,
        jql: str,
        fields: List[str],
        max_results: int,
        expand_rendered_fields: bool = False,
    ) -> List[Issue]:
        """Fetch issues directly from Jira based on JQL query

        Args:
            connection_id (str): Jira connection ID
            jql (str): JQL query string
            fields (List[str]): List of fields to fetch
            max_results (int): Maximum number of results to fetch
            expand_rendered_fields (bool): Whether to expand rendered fields
        Returns:
            List[Issue]: List of fetched issues
        """
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        response = self._exec_refreshing_access_token(
            connection,
            JiraClient.search_issues,
            cloud_id=connection.cloud_id,
            jql=jql,
            fields=fields,
            max_results=max_results,
            expand_rendered_fields=expand_rendered_fields,
        )
        return response.issues

    def fetch_issue(
        self,
        connection_id: str,
        issue_key: str,
        fields: List[str],
        expand_rendered_fields: bool = False,
    ) -> Issue:
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        response = self._exec_refreshing_access_token(
            connection,
            JiraClient.get_issue,
            cloud_id=connection.cloud_id,
            issue_key=issue_key,
            fields=fields,
            expand_rendered_fields=expand_rendered_fields,
        )
        return response

    def get_stories(
        self,
        connection_id: str,
        project_key: str,
        issue_keys: Optional[List[str]] = None,
        max_results: Optional[int] = None,
    ) -> List[StoryDto]:
        """Fetch issues from the local database

        Args:
            connection_id (str): Jira connection ID
            issue_keys (Optional[List[str]]): List of issue keys to filter
            max_results (Optional[int]): Maximum number of results to fetch
        Returns:
            List[StoryDto]: List of fetched stories
        """
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        query = (
            self.db.query(JiraStory)
            .join(JiraProject)
            .filter(
                JiraProject.connection_id == connection.id,
                JiraProject.key == project_key,
            )
        )
        if issue_keys:
            query = query.filter(JiraStory.key.in_(issue_keys))
        if max_results:
            query = query.limit(max_results)
        issues = query.all()
        return [
            StoryDto(
                id=issue.id,
                key=issue.key,
                summary=issue.summary,
                description=issue.description,
            )
            for issue in issues
        ]

    def update_issue(
        self,
        connection_id: str,
        issue_key: str,
        summary: Optional[str] = None,
        description: Optional[str] = None,
    ):
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        self._exec_refreshing_access_token(
            connection,
            JiraClient.update_issue,
            cloud_id=connection.cloud_id,
            issue_key=issue_key,
            summary=summary,
            description=description,
        )

    def delete_issue(self, connection_id: str, issue_key: str):
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        self._exec_refreshing_access_token(
            connection,
            JiraClient.delete_issue,
            cloud_id=connection.cloud_id,
            issue_key=issue_key,
        )

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

    def fetch_project_keys(self, user_id: str, connection_id_or_name: str) -> List[str]:
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

        return self._exec_refreshing_access_token(
            connection,
            JiraClient.fetch_project_keys,
            cloud_id=connection.cloud_id,
        )

    def fetch_story_keys(self, connection_id: str, project_key: str) -> List[str]:
        """Fetch all story issue keys for a specific project

        Args:
            db (Session): Database session
            connection_id (str): Jira connection ID
            project_key (str): The project key to fetch stories from
        Returns:
            List[str]: List of story issue keys
        """
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        return self._exec_refreshing_access_token(
            connection,
            JiraClient.fetch_story_keys,
            cloud_id=connection.cloud_id,
            project_key=project_key,
        )

    def get_project_keys(self, user_id: str, connection_id_or_name: str) -> List[str]:
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

        projects = (
            self.db.execute(
                select(JiraProject)
                .filter(JiraProject.connection_id == connection.id)
                .order_by(JiraProject.key)
            )
            .scalars()
            .all()
        )

        return [project.key for project in projects]

    def get_story_keys(self, connection_id: str, project_key: str) -> List[str]:
        """Fetch all story issue keys for a specific project

        Args:
            db (Session): Database session
            connection_id (str): Jira connection ID
            project_key (str): The project key to fetch stories from

        Returns:
            List[str]: List of story issue keys
        """
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        issues = (
            self.db.query(JiraStory.key)
            .join(JiraProject)
            .filter(
                JiraProject.connection_id == connection.id,
                JiraProject.key == project_key,
            )
            .all()
        )

        return [issue.key for issue in issues]

    def _refresh_data(self, connection: JiraConnection):
        fetched_projects = self._exec_refreshing_access_token(
            connection,
            JiraClient.fetch_projects,
            cloud_id=connection.cloud_id,
        )

        for project_dict in fetched_projects:
            fetched_issues = self._exec_refreshing_access_token(
                connection,
                JiraClient.search_issues,
                cloud_id=connection.cloud_id,
                jql=f'project="{project_dict["key"]}" AND issuetype="Story"',
                fields=["key", "summary", "description"],
                max_results=1000,
            ).issues

            stories = [
                JiraStory(
                    id=issue.id,
                    key=issue.key,
                    summary=issue.fields.summary,
                    description=(
                        adf_to_md(issue.fields.description)
                        if issue.fields.description
                        else None
                    ),
                )
                for issue in fetched_issues
            ]

            project = JiraProject(
                id=project_dict["id"],
                key=project_dict["key"],
                name=project_dict.get("name"),
                connection_id=connection.id,
                stories=stories,
            )
            self.db.merge(project)
        self.db.commit()

    def refresh_data(self, connection_id: str):
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")
        self._refresh_data(connection)

    def refresh_all_data(self):
        connections = self.db.query(JiraConnection).all()
        for connection in connections:
            self.refresh_data(connection.id)

    def refresh_data_for_user(self, user_id: str):
        connections = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.user_id == user_id)
            .all()
        )
        for connection in connections:
            self.refresh_data(connection.id)
