from sqlalchemy.orm import Session
from typing import List, Optional

from utils.security_utils import encrypt_token, decrypt_token
from common.configs import JiraConfig
from common.schemas import Platform
from common.database import uuid_generator
from features.integrations.models import Connection
from .client import JiraClient
from .models import JiraConnection
from .schemas import IssuesCreateRequest, IssueUpdate, Issue, JiraConnectionDto


class JiraService:
    @staticmethod
    def save_connection(db: Session, user_id: str, code: str):
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
            db.query(JiraConnection)
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

            db.add(existing_connection)
            db.commit()
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
        db.add_all([jira_connection, connection])
        db.commit()

        return 1

    @staticmethod
    def _refresh_access_token(db: Session, connection: JiraConnection):
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

        db.add(connection)
        db.commit()

        return new_token

    @staticmethod
    def _execute_with_refreshing(
        db: Session,
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
                access_token = JiraService._refresh_access_token(db, connection)
                return func(access_token=access_token, *args, **kwargs)
            else:
                raise e

    @staticmethod
    def create_issues(db: Session, connection_id: str, issues: List[IssueUpdate]):
        connection = (
            db.query(JiraConnection).filter(JiraConnection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")
        payload = IssuesCreateRequest(issues=issues)

        JiraService._execute_with_refreshing(
            db,
            connection,
            JiraClient.create_issues,
            cloud_id=connection.cloud_id,
            payload=payload,
        )

    @staticmethod
    def search_issues(
        db: Session,
        connection_id: str,
        jql: str,
        fields: List[str],
        max_results: int,
        expand_rendered_fields: bool = False,
    ) -> List[Issue]:
        connection = (
            db.query(JiraConnection).filter(JiraConnection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        response = JiraService._execute_with_refreshing(
            db,
            connection,
            JiraClient.search_issues,
            cloud_id=connection.cloud_id,
            jql=jql,
            fields=fields,
            max_results=max_results,
            expand_rendered_fields=expand_rendered_fields,
        )
        return response.issues

    @staticmethod
    def update_issue(
        db: Session,
        connection_id: str,
        issue_key: str,
        summary: Optional[str] = None,
        description: Optional[str] = None,
    ):
        connection = (
            db.query(JiraConnection).filter(JiraConnection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        JiraService._execute_with_refreshing(
            db,
            connection,
            JiraClient.update_issue,
            cloud_id=connection.cloud_id,
            issue_key=issue_key,
            summary=summary,
            description=description,
        )

    @staticmethod
    def get_issue(
        db: Session,
        connection_id: str,
        issue_key: str,
        fields: List[str],
        expand_rendered_fields: bool = False,
    ) -> Issue:
        connection = (
            db.query(JiraConnection).filter(JiraConnection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        response = JiraService._execute_with_refreshing(
            db,
            connection,
            JiraClient.get_issue,
            cloud_id=connection.cloud_id,
            issue_key=issue_key,
            fields=fields,
            expand_rendered_fields=expand_rendered_fields,
        )
        return response

    @staticmethod
    def get_project_settings(
        db: Session,
        connection_id: str,
        project_key: str,
        setting_key: str,
    ) -> dict:
        connection = (
            db.query(JiraConnection).filter(JiraConnection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        response = JiraService._execute_with_refreshing(
            db,
            connection,
            JiraClient.get_project_settings,
            cloud_id=connection.cloud_id,
            project_key=project_key,
            setting_key=setting_key,
        )
        return response

    @staticmethod
    def get_connection(db: Session, connection_id: str) -> JiraConnectionDto:
        connection = (
            db.query(JiraConnection).filter(JiraConnection.id == connection_id).first()
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

    @staticmethod
    def list_user_connections(db: Session, user_id: str) -> List[JiraConnectionDto]:
        connections = (
            db.query(JiraConnection).filter(JiraConnection.user_id == user_id).all()
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

    @staticmethod
    def delete_connection(db: Session, connection_id: str):
        connection = (
            db.query(JiraConnection).filter(JiraConnection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        db.delete(connection)
        db.commit()

    @staticmethod
    def fetch_project_keys(db: Session, connection_id: str) -> List[str]:
        """Fetch all project keys from Jira

        Args:
            db (Session): Database session
            connection_id (str): Jira connection ID

        Returns:
            List[str]: List of project keys
        """
        connection = (
            db.query(JiraConnection).filter(JiraConnection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        return JiraService._execute_with_refreshing(
            db,
            connection,
            JiraClient.fetch_project_keys,
            cloud_id=connection.cloud_id,
        )

    @staticmethod
    def fetch_story_keys(
        db: Session, connection_id: str, project_key: str
    ) -> List[str]:
        """Fetch all story issue keys for a specific project

        Args:
            db (Session): Database session
            connection_id (str): Jira connection ID
            project_key (str): The project key to fetch stories from

        Returns:
            List[str]: List of story issue keys
        """
        connection = (
            db.query(JiraConnection).filter(JiraConnection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        return JiraService._execute_with_refreshing(
            db,
            connection,
            JiraClient.fetch_story_keys,
            cloud_id=connection.cloud_id,
            project_key=project_key,
        )
