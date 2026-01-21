from sqlalchemy.orm import Session
from utils.security_utils import encrypt_token, decrypt_token
from common.configs import JiraConfig
from ..client import JiraClient
from ..models import Connection
from ..schemas import (
    Issue,
)
from ..vectorstore import JiraVectorStore


AC_ISSUE_TYPE_NAME = "Gherkin Test"
AC_ISSUE_TYPE_DESCRIPTION = "Issue type for Gherkin acceptance criteria"
AC_ISSUE_TYPE_LEVEL = "subtask"


class JiraBaseService:
    def __init__(self, db: Session):
        self.db = db
        self.vector_store = JiraVectorStore()

    def __refresh_access_token(self, connection: Connection):
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
        connection: Connection,
        func,
        *args,
        **kwargs,
    ):
        try:
            access_token = decrypt_token(connection.token, connection.token_iv)
            return func(access_token=access_token, *args, **kwargs)
        except Exception as e:
            if "401" in str(e) or "400" in str(e):
                print("Access token expired, refreshing...")
                access_token = self.__refresh_access_token(connection)
                return func(access_token=access_token, *args, **kwargs)
            else:
                raise e

    def fetch_issues(
        self,
        connection_id: str,
        jql: str,
        fields: list[str],
        max_results: int | None = None,
        expand_rendered_fields: bool = False,
    ) -> list[Issue]:
        """Fetch issues from local cache or Jira based on JQL query

        Args:
            connection_id (str): Jira connection ID
            jql (str): JQL query string
            fields (List[str]): List of fields to fetch
            max_results (int): Maximum number of results to fetch
            expand_rendered_fields (bool): Whether to expand rendered fields
            local (bool): Fetch from local cache (True) or from Jira (False). Defaults to True.
        Returns:
            List[Issue]: List of fetched issues
        """
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        response = self._exec_refreshing_access_token(
            connection,
            JiraClient.search_issues,
            cloud_id=connection.id_,
            jql=jql,
            fields=fields,
            max_results=max_results,
            expand_rendered_fields=expand_rendered_fields,
        )
        return response.issues
