from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from utils.markdown_adf_bridge.markdown_adf_bridge import md_to_adf, adf_to_md
from utils.security_utils import encrypt_token, generate_jwt
from common.configs import JiraConfig
from common.vectorstore import default_vectorstore
from common.neo4j_app import delete_bucket_safe
from .base_service import JiraBaseService
from ..client import JiraClient
from ..models import Connection, Project, Story, GherkinAC
from ..schemas import (
    ConnectionDto,
    ConnectionSyncStatusDto,
    ProjectDto,
    ProjectDtoSync,
    StoryDto,
    CreateIssuesRequest,
    StorySummary,
    UpdateStoryRequest,
    IssueUpdate,
    Issue,
    CreateStoryRequest,
    WebhookCallbackPayload,
    SyncProjectsRequest,
)
from ..tasks import setup_connection, sync_projects

from app.documentation.services import DocumentationService

# from app.xgraphrag.increment import GraphRAGUpdater
from common.database import uuid_generator


class JiraService(JiraBaseService):
    def __init__(self, db: Session):
        super().__init__(db)

    def save_connection(self, code: str):
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

        connection = (
            self.db.query(Connection)
            .filter(
                Connection.id == cloud_info.id,
            )
            .first()
        )

        new = True

        if connection:
            connection.token = encryped_token
            connection.token_iv = token_iv
            connection.refresh_token = refresh_encrypted_token
            connection.refresh_token_iv = refresh_token_iv

            new = False
        else:
            connection = Connection(
                id=cloud_info.id,
                token=encryped_token,
                token_iv=token_iv,
                refresh_token=refresh_encrypted_token,
                refresh_token_iv=refresh_token_iv,
                name=cloud_info.name,
                url=cloud_info.url,
                scopes=" ".join(cloud_info.scopes) if cloud_info.scopes else None,
                avatar_url=cloud_info.avatarUrl,
            )

        self.db.add(connection)
        self.db.commit()

        if new:
            setup_connection.delay(connection_id=connection.id)

        return generate_jwt(connection_id=connection.id)

    def sync_projects(
        self,
        connection_id: str,
        request: SyncProjectsRequest,
    ):
        """Sync selected projects: fetch stories from Jira and save to local DB and vector store"""
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        sync_projects.delay(
            connection_id=connection_id,
            request=request,
        )

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

    def get_connection_sync_status(self, connection_id: str) -> str:
        connection = (
            self.db.query(Connection)
            .filter(
                Connection.id == connection_id,
            )
            .first()
        )

        if not connection:
            raise ValueError("Connection not found")

        return ConnectionSyncStatusDto(
            sync_status=connection.sync_status.value,
            sync_message=connection.sync_message,
            sync_error=connection.sync_error.value if connection.sync_error else None,
        )

    def _create_issues(self, connection: Connection, issues: list[IssueUpdate | dict]):
        issue_updates = [
            i.model_dump() if isinstance(i, IssueUpdate) else i for i in issues
        ]

        return self._exec_refreshing_access_token(
            connection,
            JiraClient.create_issues,
            cloud_id=connection.id,
            issue_updates=issue_updates,
        )

    def create_issues(
        self, connection_id: str, issues: list[IssueUpdate | dict]
    ) -> list[str]:
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")
        return self._create_issues(connection, issues=issues)

    def create_story(
        self,
        connection_id: str,
        project_key: str,
        story: CreateStoryRequest,
        transaction_id: str = None,
    ) -> str:
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        fields = {
            "project": {"key": project_key},
            "summary": story.summary,
            "description": md_to_adf(story.description),
            "issuetype": {"name": "Story"},
        }
        if transaction_id:
            fields[connection.ai_transaction_id_field_id] = transaction_id
        return self._exec_refreshing_access_token(
            connection,
            JiraClient.create_issue,
            cloud_id=connection.id,
            payload={"fields": fields},
        )

    def create_stories(
        self,
        connection_id: str,
        project_key: str,
        stories: list[CreateStoryRequest],
        transaction_id: str = None,
    ):
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )

        if not connection:
            raise ValueError("Connection not found")

        issues = []
        for story in stories:
            fields = {
                "project": {"key": project_key},
                "summary": story.summary,
                "description": md_to_adf(story.description),
                "issuetype": {"name": "Story"},
            }
            if transaction_id:
                fields[connection.ai_transaction_id_field_id] = transaction_id
            payload = {"fields": fields}
            issues.append(payload)

        return self._create_issues(connection=connection, issues=issues)

    def fetch_stories(
        self,
        connection_id: str,
        project_key: str = None,
        story_keys: list[str] | None = None,
        max_results: int | None = None,
        local: bool = True,
        get_raw_response: bool = False,
    ) -> list[StoryDto]:
        """Fetch stories from local cache or Jira based on project key and/or story keys"""
        if not project_key and len(story_keys or []) == 0:
            raise ValueError(
                "At least one of project_key or story_keys must be provided"
            )

        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        if local:
            query = (
                self.db.query(Story)
                .join(Project)
                .filter(Project.connection_id == connection.id)
            )

            if project_key:
                query = query.filter(Project.key == project_key)

            if story_keys:
                query = query.filter(Story.key.in_(story_keys))

            if max_results:
                query = query.limit(max_results)

            stories = query.order_by(Story.key).all()

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
        issues = self._fetch_issues(
            connection=connection,
            jql=f'project = "issuetype = Story'
            + (f" AND project = {project_key}" if project_key else "")
            + (f' AND key IN ({", ".join(story_keys)})' if story_keys else ""),
            fields=["summary", "description", "priority"],
            max_results=max_results,
            expand_rendered_fields=False,
            get_raw_response=get_raw_response,
        )

        if get_raw_response:
            return issues

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
        fields: list[str],
        expand_rendered_fields: bool = False,
        local: bool = True,
    ) -> Issue:
        """Fetch a single issue from local cache or Jira

        Args:
            connection_id (str): Jira connection ID
            issue_key (str): The issue key to fetch
            fields (list[str]): List of fields to fetch
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
            cloud_id=connection.id,
            issue_key=issue_key,
            fields=fields,
            expand_rendered_fields=expand_rendered_fields,
        )
        return response

    def update_stories(
        self,
        connection_id: str,
        project_key: str,
        story_updates: list[UpdateStoryRequest],
        transaction_id: str = None,
    ):
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        for story_update in story_updates:
            fields = {}
            if story_update.summary:
                fields["summary"] = story_update.summary
            if story_update.description:
                fields["description"] = md_to_adf(story_update.description)
            if transaction_id:
                fields[connection.ai_transaction_id_field_id] = transaction_id
            self._exec_refreshing_access_token(
                connection,
                JiraClient.update_issue,
                cloud_id=connection.id,
                issue_key=story_update.key,
                payload={"fields": fields},
            )

    def update_issue(
        self,
        connection_id: str,
        project_key: str,
        issue_key: str,
        summary: Optional[str] = None,
        description: Optional[str] = None,
        transaction_id: str = None,
    ):
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        fields = {}
        if summary:
            fields["summary"] = summary
        if description:
            fields["description"] = md_to_adf(description)
        if transaction_id:
            fields[connection.ai_transaction_id_field_id] = transaction_id

        self._exec_refreshing_access_token(
            connection,
            JiraClient.update_issue,
            cloud_id=connection.id,
            issue_key=issue_key,
            payload={"fields": fields},
        )

    def delete_issue(self, connection_id: str, project_key: str, issue_key: str):
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        self._exec_refreshing_access_token(
            connection,
            JiraClient.delete_issue,
            cloud_id=connection.id,
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
            cloud_id=connection.id,
            project_key=project_key,
            setting_key=setting_key,
        )
        return response

    def get_connection(self, connection_id: str) -> ConnectionDto:
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        project_count = (
            self.db.query(func.count(Project.id))
            .filter(Project.connection_id == connection.id)
            .scalar()
        )

        return ConnectionDto(
            id=connection.id,
            cloud_id=connection.id,
            name=connection.name,
            url=connection.url,
            avatar_url=connection.avatar_url,
            num_projects=project_count,
        )

    def fetch_project_dtos(
        self, connection_id: str, local: bool = True
    ) -> list[ProjectDto]:
        connection = (
            self.db.query(Connection)
            .filter(
                Connection.id == connection_id,
            )
            .first()
        )

        if not connection:
            raise ValueError("Connection not found")

        if local:
            projects = (
                self.db.query(
                    Project.id,
                    Project.key,
                    Project.name,
                    Project.avatar_url,
                    func.count(Story.id).label("num_stories"),
                )
                .filter(Project.connection_id == connection.id)
                .outerjoin(Story, Story.project_id == Project.id)
                .group_by(Project.id)
                .order_by(Project.key)
                .all()
            )
            return [
                ProjectDto(
                    id=prod.id,
                    key=prod.key,
                    name=prod.name,
                    avatar_url=prod.avatar_url,
                    num_stories=prod.num_stories,
                )
                for prod in projects
            ]

        return self._exec_refreshing_access_token(
            connection,
            JiraClient.fetch_projects,
            cloud_id=connection.id,
            project_keys=["RD", "VBS"],
        )

    def fetch_story_summaries(
        self,
        connection_id: str,
        project_key: str,
        local: bool = True,
    ) -> list[StorySummary]:
        """Fetch all story issue keys for a specific project

        Args:
            db (Session): Database session
            connection_id (str): Jira connection ID
            project_key (str): The project key to fetch stories from
        Returns:
            list[str]: List of story issue keys
        """
        conn_proj = (
            self.db.query(Connection, Project)
            .join(Project)
            .filter(
                Connection.id == connection_id,
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
                connection_id=connection.id,
                project_key=project_key,
                local=False,
            )
        ]

    def fetch_all_projects_checked_sync(
        self, connection_id: str
    ) -> list[ProjectDtoSync]:
        """Fetch all projects and check sync status for each one"""
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        # Return local projects
        projects = (
            self.db.query(Project).filter(Project.connection_id == connection.id).all()
        )

        try:
            remote_projects = self._exec_refreshing_access_token(
                connection,
                JiraClient.fetch_projects,
                cloud_id=connection.id,
            )

        except Exception as e:
            print(f"Error fetching remote projects for sync check: {e}")

            return [
                ProjectDtoSync(
                    id=proj.id_,
                    key=proj.key,
                    name=proj.name,
                    avatar_url=proj.avatar_url,
                    synced=proj.synced,
                )
                for proj in projects
            ]

        # If a remote project exists locally and is marked as synced -> synced=True, else False
        projects_dict = {proj.key: proj for proj in projects}
        project_dtos = []
        for remote_proj in remote_projects:
            local_proj = projects_dict.get(remote_proj.key)
            synced = local_proj.synced if local_proj else False
            project_dtos.append(
                ProjectDtoSync(
                    id=remote_proj.id,
                    key=remote_proj.key,
                    name=remote_proj.name,
                    avatar_url=remote_proj.avatar_url,
                    synced=synced,
                )
            )
        return project_dtos

    def _on_story_create(self, connection_id: str, payload: dict):
        """Handle a story creation webhook from a single issue payload."""
        issue = payload.get("issue", payload)
        fields = issue.get("fields", {}) or {}
        project_key = (fields.get("project") or {}).get("key")
        if not project_key:
            raise ValueError("Project key not found in webhook payload")

        connection, project = self.__get_connection_and_project(
            connection_id, project_key
        )

        self.__on_story_create(connection=connection, project=project, issue=issue)

    def __on_story_create(self, connection: Connection, project: Project, issue: dict):
        try:
            fields = issue.get("fields", {}) or {}
            story = Story(
                id=uuid_generator(),
                id_=issue.get("id"),
                key=issue.get("key"),
                summary=fields.get("summary"),
                description=(
                    adf_to_md(fields.get("description"))
                    if fields.get("description")
                    else None
                ),
                project_id=project.id,
            )
            self.db.add(story)

            self.db.commit()

            to_vector = [
                StoryDto(
                    id=story.id,
                    key=story.key,
                    summary=story.summary,
                    description=story.description,
                )
            ]

            # graphrag_updater = GraphRAGUpdater(
            #     connection_id=connection.id,
            #     project_key=project.key,
            # )

            # graphrag_updater.add_stories(stories=to_vector)

            self.taxonomy_service.update_buckets(
                connection_id=connection.id,
                project_key=project.key,
                stories=to_vector,
                project_description=project.description,
            )

            self.vector_store.add_stories(
                connection_id=connection.id,
                project_key=project.key,
                stories=to_vector,
            )

            from app.proposal.services import ProposalService

            proposal_service = ProposalService(self.db)

            transaction_field_id = connection.ai_transaction_id_field_id
            transaction_id = (
                fields.get(transaction_field_id) if transaction_field_id else None
            )
            if transaction_id and proposal_service.is_story_checked_in_generation(
                transaction_id=transaction_id,
                story_key=story.key,
            ):
                self._run_analysis_targeted(
                    connection_id=connection.id,
                    project_key=project.key,
                    story_key=story.key,
                )

        except Exception as e:
            self.db.rollback()
            print(f"Error creating story: {e}")
            raise

    def _on_story_update(self, connection_id: str, payload: dict):
        """Handle a story update webhook from a single issue payload."""
        issue = payload.get("issue", payload)
        fields = issue.get("fields", {}) or {}
        project_key = (fields.get("project") or {}).get("key")
        if not project_key:
            raise ValueError("Project key not found in webhook payload")

        connection, project = self.__get_connection_and_project(
            connection_id, project_key
        )

        self.__on_story_update(connection=connection, project=project, issue=issue)

    def __on_story_update(self, connection: Connection, project: Project, issue: dict):
        print("Updating story:", issue.get("key"))
        try:
            story = (
                self.db.query(Story)
                .join(Project)
                .filter(
                    Project.connection_id == connection.id,
                    Project.key == project.key,
                    Story.key == issue.get("key"),
                )
                .first()
            )
            if not story:
                return

            fields = issue.get("fields", {}) or {}
            story.summary = fields.get("summary")
            story.description = (
                adf_to_md(fields.get("description"))
                if fields.get("description")
                else None
            )

            to_vector = [
                StoryDto(
                    id=story.id,
                    key=story.key,
                    summary=story.summary,
                    description=story.description,
                )
            ]

            self.db.commit()

            # graphrag_updater = GraphRAGUpdater(
            #     connection_id=connection.id,
            #     project_key=project.key,
            # )

            # graphrag_updater.update_stories(stories=to_vector)

            self.taxonomy_service.update_buckets(
                connection_id=connection.id,
                project_key=project.key,
                stories=to_vector,
                project_description=project.description,
            )

            self.vector_store.update_stories(
                connection_id=connection.id,
                project_key=project.key,
                stories=to_vector,
            )

            from app.proposal.services import ProposalService

            proposal_service = ProposalService(self.db)

            transaction_field_id = connection.ai_transaction_id_field_id
            transaction_id = (
                fields.get(transaction_field_id) if transaction_field_id else None
            )
            if transaction_id and proposal_service.is_story_checked_in_generation(
                transaction_id=transaction_id,
                story_key=story.key,
            ):
                self._run_analysis_targeted(
                    connection_id=connection.id,
                    project_key=project.key,
                    story_key=story.key,
                )

        except Exception as e:
            self.db.rollback()
            print(f"Error updating story: {e}")
            raise

    def _on_story_delete(self, connection_id: str, payload: dict):
        """Handle a story deletion webhook from a single issue payload."""
        issue = payload.get("issue", payload)
        fields = issue.get("fields", {}) or {}
        project_key = (fields.get("project") or {}).get("key")
        if not project_key:
            raise ValueError("Project key not found in webhook payload")

        connection, project = self.__get_connection_and_project(
            connection_id, project_key
        )
        self.__on_story_delete(connection=connection, project=project, issue=issue)

    def __on_story_delete(self, connection: Connection, project: Project, issue: dict):
        story_key = issue.get("key")
        print("Deleting story:", story_key)
        try:
            # Get the story from local DB
            story = (
                self.db.query(Story)
                .join(Project)
                .filter(
                    Project.connection_id == connection.id,
                    Project.key == project.key,
                    Story.key == story_key,
                )
                .first()
            )
            if not story:
                return

            story_ids = [story.id]
            self.db.delete(story)
            self.db.commit()

            # graphrag_updater = GraphRAGUpdater(
            #     connection_id=connection.id,
            #     project_key=project.key,
            # )

            # graphrag_updater.delete_stories(story_keys=story_keys)

            self.taxonomy_service.delete_buckets_by_story_keys(
                connection_id=connection.id,
                project_key=project.key,
                story_keys=[story_key],
            )

            self.vector_store.remove_stories(
                connection_id=connection.id,
                project_key=project.key,
                story_ids=story_ids,
            )

        except Exception as e:
            self.db.rollback()
            print(f"Error deleting story: {e}")
            raise

    def delete_connection(self, connection_id: str):
        """
        Delete a Jira connection and all associated data

        Args:
            connection_id (str): The ID of the Jira connection to delete
        """
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")
        # Delete webhooks in Jira
        print("Deleting webhooks for connection:", connection_id)
        webhooks = self._exec_refreshing_access_token(
            connection,
            JiraClient.get_webhooks,
            cloud_id=connection.id,
        )

        webhook_ids = [webhook["id"] for webhook in webhooks]
        if webhook_ids:
            self._exec_refreshing_access_token(
                connection,
                JiraClient.delete_webhooks,
                cloud_id=connection.id,
                webhook_ids=webhook_ids,
            )

        # Delete from vector store
        print("Deleting connection from vector store:", connection_id)
        default_vectorstore.delete(
            where={"connection_id": connection_id},
        )

        # Delete all documentation related to this connection
        print("Deleting documentation for connection:", connection_id)
        DocumentationService(self.db).delete_all_docs(connection_id)

        print("Deleting connection from neo4j:", connection_id)
        projects = (
            self.db.query(Project).filter(Project.connection_id == connection_id).all()
        )
        for project in projects:
            delete_bucket_safe(f"{connection_id}_{project.key}")

        self.db.delete(connection)
        self.db.commit()

        print(
            f"Connection {connection_id} and all associated data deleted successfully"
        )

    def handle_webhook(
        self,
        connection_id: str,
        payload: WebhookCallbackPayload,
    ):
        """Handle incoming Jira webhook payloads"""
        try:
            issue = payload.issue
            fields = issue.get("fields", {}) or {}
            project_key = (fields.get("project") or {}).get("key")
            issue_type_name = (fields.get("issuetype") or {}).get("name")
            if issue_type_name == "Story":
                match payload.webhookEvent:
                    case "jira:issue_created":
                        self._on_story_create(
                            connection_id=connection_id, payload=payload.model_dump()
                        )
                    case "jira:issue_updated":
                        self._on_story_update(
                            connection_id=connection_id, payload=payload.model_dump()
                        )
                    case "jira:issue_deleted":
                        self._on_story_delete(
                            connection_id=connection_id, payload=payload.model_dump()
                        )
            else:
                match payload.webhookEvent:
                    case "jira:issue_created":
                        self._on_ac_create(
                            connection_id=connection_id,
                            project_key=project_key,
                            story_key=(fields.get("parent") or {}).get("key"),
                            ac_id_=issue.get("id"),
                            ac_key=issue.get("key"),
                            summary=fields.get("summary"),
                            description=(
                                adf_to_md(fields.get("description"))
                                if fields.get("description")
                                else None
                            ),
                        )
                    case "jira:issue_updated":
                        self._on_ac_update(
                            connection_id=connection_id,
                            project_key=project_key,
                            story_key=(fields.get("parent") or {}).get("key"),
                            ac_key=issue.get("key"),
                            summary=fields.get("summary"),
                            description=(
                                adf_to_md(fields.get("description"))
                                if fields.get("description")
                                else None
                            ),
                        )
                    case "jira:issue_deleted":
                        self._on_ac_delete(
                            connection_id=connection_id,
                            project_key=project_key,
                            story_key=(fields.get("parent") or {}).get("key"),
                            ac_key=issue.get("key"),
                        )
        except Exception as e:
            print(f"Error handling webhook for connection {connection_id}: {e}")
            raise

    def get_webhooks(self, connection_id: str):
        connection = (
            self.db.query(Connection).filter(Connection.id == connection_id).first()
        )
        if not connection:
            raise ValueError("Connection not found")

        response = self._exec_refreshing_access_token(
            connection,
            JiraClient.get_webhooks,
            cloud_id=connection.id,
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
            cloud_id=connection.id,
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

    def get_project_description(self, connection_id: str, project_key: str) -> str:
        """Fetch project description from Jira"""
        project = (
            self.db.query(Project)
            .filter(
                Project.connection_id == connection_id,
                Project.key == project_key,
            )
            .first()
        )
        if not project:
            raise ValueError("Project not found")
        return project.description

    def update_project_description(
        self, connection_id: str, project_key: str, description: str
    ):
        """Update project description in Jira and local DB"""
        project = (
            self.db.query(Project)
            .filter(
                Project.connection_id == connection_id,
                Project.key == project_key,
            )
            .first()
        )
        if not project:
            raise ValueError("Project not found")

        project.description = description
        self.db.commit()
