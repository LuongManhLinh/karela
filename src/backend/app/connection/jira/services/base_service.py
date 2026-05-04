from sqlalchemy.orm import Session
from utils.security_utils import encrypt_token, decrypt_token
from common.configs import JiraConfig
from ..client import JiraClient
from ..models import Connection
from ..schemas import (
    Issue,
)

from ..vectorstore import JiraVectorStore
from app.taxonomy.services import TaxonomyService

AC_ISSUE_TYPE_NAME = "Gherkin Test"
AC_ISSUE_TYPE_DESCRIPTION = "Issue type for Gherkin acceptance criteria"
AC_ISSUE_TYPE_LEVEL = "subtask"
AI_TRANSACTION_ID_FIELD_NAME = "AI Transaction ID"
AI_TRANSACTION_ID_FIELD_DESCRIPTION = (
    "Transaction ID for AI generated proposal for this issue"
)


class JiraBaseService:
    def __init__(self, db: Session):
        self.db = db
        self.vector_store = JiraVectorStore()
        self.taxonomy_service = TaxonomyService(db=db)

    def __refresh_access_token(self, connection: Connection):
        refresh_token = decrypt_token(
            connection.refresh_token, connection.refresh_token_iv
        )

        access_token, refresh_token = JiraClient.refresh_access_token(
            client_id=JiraConfig.CLIENT_ID,
            client_secret=JiraConfig.CLIENT_SECRET,
            refresh_token=refresh_token,
        )

        encrypted_atok, atok_iv = encrypt_token(access_token)
        connection.token = encrypted_atok
        connection.token_iv = atok_iv

        encrypted_rtok, rtok_iv = encrypt_token(refresh_token)
        connection.refresh_token = encrypted_rtok
        connection.refresh_token_iv = rtok_iv

        self.db.add(connection)
        self.db.commit()

        return access_token

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

    def _fetch_issues(
        self,
        connection: Connection,
        jql: str,
        fields: list[str],
        max_results: int | None = None,
        expand_rendered_fields: bool = False,
        get_raw_response: bool = False,
    ):
        response = self._exec_refreshing_access_token(
            connection,
            JiraClient.search_issues,
            cloud_id=connection.id,
            jql=jql,
            fields=fields,
            max_results=max_results,
            expand_rendered_fields=expand_rendered_fields,
            get_raw_response=get_raw_response,
        )
        if get_raw_response:
            return response["issues"]
        return response.issues

    def validate_connection(self, connection_id: str) -> bool:
        connection_count = (
            self.db.query(Connection).filter(Connection.id == connection_id).count()
        )
        if connection_count == 0:
            return False
        return True

    def fetch_issues(
        self,
        connection_id: str,
        jql: str,
        fields: list[str],
        max_results: int | None = None,
        expand_rendered_fields: bool = False,
        get_raw_response: bool = False,
    ) -> list[Issue]:
        """Fetch issues from local cache or Jira based on JQL query

        Args:
            connection_id (str): Jira connection ID
            jql (str): JQL query string
            fields (list[str]): List of fields to fetch
            max_results (int): Maximum number of results to fetch
            expand_rendered_fields (bool): Whether to expand rendered fields
            local (bool): Fetch from local cache (True) or from Jira (False). Defaults to True.
        Returns:
            list[Issue]: List of fetched issues
        """
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        return self._fetch_issues(
            connection,
            jql,
            fields,
            max_results,
            expand_rendered_fields,
            get_raw_response,
        )

    def _run_analysis_targeted(
        self, connection_id: str, project_key: str, story_key: str
    ):
        from app.analysis.services import AnalysisDataService
        from app.analysis.tasks import run_analysis

        ana_data_service = AnalysisDataService(db=self.db)
        analysis_id, _ = ana_data_service.init_analysis(
            connection_id=connection_id,
            project_key=project_key,
            story_key=story_key,
            analysis_type="TARGETED",
        )
        run_analysis(analysis_id=analysis_id)

    def _run_analysis_all(self, connection_id: str, project_key: str):
        from app.analysis.services import AnalysisDataService
        from app.analysis.tasks import run_analysis

        ana_data_service = AnalysisDataService(db=self.db)
        analysis_id, _ = ana_data_service.init_analysis(
            connection_id=connection_id,
            project_key=project_key,
            story_key=None,
            analysis_type="ALL",
        )
        run_analysis(analysis_id=analysis_id)
