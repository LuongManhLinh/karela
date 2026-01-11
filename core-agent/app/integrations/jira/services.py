from sqlalchemy.orm import Session
from sqlalchemy import or_, select
from typing import List, Optional

from utils.markdown_adf_bridge.markdown_adf_bridge import md_to_adf, adf_to_md
from utils.security_utils import encrypt_token, decrypt_token
from common.configs import JiraConfig
from common.schemas import Platform
from common.database import uuid_generator
from common.redis_app import task_queue
from app.integrations.models import Connection
from .client import JiraClient
from .models import JiraConnection, JiraProject, JiraStory
from .schemas import (
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

from .vectorstore import JiraVectorStore


AC_ISSUE_TYPE_NAME = "Gherkin Test"
AC_ISSUE_TYPE_DESCRIPTION = "Issue type for Gherkin acceptance criteria"
AC_ISSUE_TYPE_LEVEL = "subtask"


class JiraService:
    def __init__(self, db: Session):
        self.db = db
        self.vector_store = JiraVectorStore()

    def save_connection(self, user_id: str, code: str):
        print("Saving Jira connection for user_id:", user_id)
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

            task_queue.enqueue(self._on_connection_update, existing_connection)
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

        def _on_new_connection_setup(jira_connection: JiraConnection):
            print("Updating Jira connection data...")
            self._on_connection_update(jira_connection)

            print("Setting up 'AC' issue type...")
            issue_type_id = self._create_ac_issue_type(jira_connection)
            self._update_issue_type_for_connection(jira_connection, issue_type_id)

            print("Registering webhooks...")
            self._register_webhooks(jira_connection)

        task_queue.enqueue(_on_new_connection_setup, jira_connection)

        return 1

    def __refresh_access_token(self, connection: JiraConnection):
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

    def __exec_refreshing_access_token(
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
            if "401" in str(e) or "400" in str(e):
                print("Access token expired, refreshing...")
                access_token = self.__refresh_access_token(connection)
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
        payload = CreateIssuesRequest(issueUpdates=issues)

        return self.__exec_refreshing_access_token(
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
                JiraProject.jira_connection_id == connection_id,
                JiraProject.key == project_key,
            )
            .first()
        )
        if not project:
            raise ValueError("Project not found")

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

        created_keys = self.__exec_refreshing_access_token(
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
                JiraProject.jira_connection_id == connection_id,
                JiraProject.key == project_key,
            )
            .first()
        )
        if not project:
            raise ValueError("Project not found")

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

        story_key = self.__exec_refreshing_access_token(
            connection,
            JiraClient.create_issue,
            cloud_id=connection.cloud_id,
            payload=payload,
        )

        # Update local data, vector store, and Jira
        self.__on_stories_create(connection, project, [story_key])
        return story_key

    def fetch_issues(
        self,
        connection_id: str,
        jql: str,
        fields: List[str],
        max_results: int | None = None,
        expand_rendered_fields: bool = False,
        local: bool = True,
    ) -> List[Issue]:
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
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        if local:
            # TODO: support JQL parsing for local cache; currently return empty list
            return []

        response = self.__exec_refreshing_access_token(
            connection,
            JiraClient.search_issues,
            cloud_id=connection.cloud_id,
            jql=jql,
            fields=fields,
            max_results=max_results,
            expand_rendered_fields=expand_rendered_fields,
        )
        return response.issues

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
            # Fetch from local database
            connection = (
                self.db.query(JiraConnection)
                .filter(JiraConnection.id == connection_id)
                .first()
            )
            if not connection:
                raise ValueError("Connection not found")

            # Get project
            project = (
                self.db.query(JiraProject)
                .filter(
                    JiraProject.jira_connection_id == connection_id,
                    JiraProject.key == project_key,
                )
                .first()
            )
            if not project:
                return []

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

        response = self.__exec_refreshing_access_token(
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

        self.__exec_refreshing_access_token(
            connection,
            JiraClient.update_issue,
            cloud_id=connection.cloud_id,
            issue_key=issue_key,
            summary=summary,
            description=md_to_adf(description) if description else None,
        )

        # Get project key from the issue
        project = (
            self.db.query(JiraProject)
            .join(JiraStory)
            .filter(JiraStory.key == issue_key)
            .first()
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
            self.__exec_refreshing_access_token(
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

    def delete_issue(self, connection_id: str, issue_key: str):
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        # Get project key and story before deletion
        story = (
            self.db.query(JiraStory)
            .join(JiraProject)
            .filter(JiraStory.key == issue_key)
            .first()
        )
        project_key = story.jira_project.key if story else None

        self.__exec_refreshing_access_token(
            connection,
            JiraClient.delete_issue,
            cloud_id=connection.cloud_id,
            issue_key=issue_key,
        )

        self.__on_stories_delete(connection, project_key, [issue_key])

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

        response = self.__exec_refreshing_access_token(
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
                ProjectDto(id=prod.id, key=prod.key, name=prod.name)
                for prod in projects
            ]

        return [
            ProjectDto(
                id=project_dict["id"],
                key=project_dict["key"],
                name=project_dict["name"],
            )
            for project_dict in self.__exec_refreshing_access_token(
                connection,
                JiraClient.fetch_projects,
                cloud_id=connection.cloud_id,
            )
        ]

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
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        if local:
            project = (
                self.db.query(JiraProject.id)
                .filter(
                    JiraProject.jira_connection_id == connection_id,
                    JiraProject.key == project_key,
                )
                .first()
            )
            if not project:
                raise ValueError(f"Project {project_key} not found")

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

    def _on_connection_update(self, connection: JiraConnection):
        """Fetch projects and stories from Jira and cache them locally, including vector store"""
        try:
            # Clear existing projects and stories for this connection
            self.db.query(JiraProject).filter(
                JiraProject.jira_connection_id == connection.id
            ).delete()
            self.db.commit()

            # Fetch all projects from Jira
            print("Fetching projects from Jira...")
            projects_data = self.__exec_refreshing_access_token(
                connection,
                JiraClient.fetch_projects,
                cloud_id=connection.cloud_id,
            )

            # Save projects and fetch stories for each
            for project_data in projects_data:
                print("Processing project:", project_data["key"])
                jira_project = JiraProject(
                    id=project_data["id"],
                    key=project_data["key"],
                    name=project_data["name"],
                    jira_connection_id=connection.id,
                )
                self.db.add(jira_project)
                self.db.flush()

                project_stories: list[StoryDto] = []

                # Fetch stories for this project
                issues = self.fetch_issues(
                    connection_id=connection.id,
                    jql=f'project = "{project_data["key"]}" AND issuetype = Story',
                    fields=["summary", "description"],
                    local=False,
                )

                # Save stories locally
                for issue in issues:
                    description_md = (
                        adf_to_md(issue.fields.description)
                        if issue.fields.description
                        else None
                    )
                    jira_story = JiraStory(
                        id=issue.id or uuid_generator(),
                        key=issue.key,
                        summary=issue.fields.summary,
                        description=description_md,
                        jira_project_id=jira_project.id,
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

                # Push this project's stories to vector store
                if project_stories:
                    print("Persisting stories to vector store...")
                    self.vector_store.add_stories(
                        connection_id=connection.id,
                        project_key=project_data["key"],
                        stories=project_stories,
                    )

            self.db.commit()

        except Exception as e:
            self.db.rollback()
            print(f"Error updating connection: {e}")
            raise

    def _update_issue_type_for_connection(
        self, connection: JiraConnection, issue_type_id: str
    ):
        print("Updating 'AC' issue type for all projects in the connection...")
        try:
            self.__exec_refreshing_access_token(
                connection=connection,
                func=JiraClient.add_issue_type_to_activated_schemes,
                cloud_id=connection.cloud_id,
                issue_type_id=issue_type_id,
            )
        except Exception as e:
            print(f"Error adding issue type to projects: {e}")
            raise

    def _on_stories_create(
        self, connection_id: str, project_key: str, story_keys: List[str]
    ):
        """Handle story creation: save to local DB and vector store"""
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
                JiraProject.jira_connection_id == connection_id,
                JiraProject.key == project_key,
            )
            .first()
        )
        if not project:
            raise ValueError("Project not found")

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
                JiraProject.jira_connection_id == connection_id,
                JiraProject.key == project_key,
            )
            .first()
        )
        if not project:
            raise ValueError("Project not found")

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
                JiraProject.jira_connection_id == connection_id,
                JiraProject.key == project_key,
            )
            .first()
        )
        if not project:
            raise ValueError("Project not found")
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

    def _register_webhooks(self, connection: JiraConnection):
        """Register webhooks for the Jira connection"""
        self.__exec_refreshing_access_token(
            connection=connection,
            func=JiraClient.register_webhook,
            cloud_id=connection.cloud_id,
            url=f"{JiraConfig.WEBHOOK_URL}/{connection.id}",
            events=JiraConfig.WEBHOOK_EVENTS,
        )

    def _create_ac_issue_type(self, connection: JiraConnection):
        """Create 'AC' issue type in Jira if it doesn't exist"""
        try:
            print("Creating 'AC' issue type in Jira...")
            issue_type_id = self.__exec_refreshing_access_token(
                connection=connection,
                func=JiraClient.create_issue_type,
                cloud_id=connection.cloud_id,
                name=AC_ISSUE_TYPE_NAME,
                description=AC_ISSUE_TYPE_DESCRIPTION,
                level=AC_ISSUE_TYPE_LEVEL,
            )
            print("Created 'AC' issue type with ID:", issue_type_id)
            return issue_type_id
        except Exception as e:
            if "409" in str(e):
                print("'AC' issue type already exists.")
                issue_type_id = self.__exec_refreshing_access_token(
                    connection=connection,
                    func=JiraClient.get_issue_type_by_name,
                    cloud_id=connection.cloud_id,
                    name=AC_ISSUE_TYPE_NAME,
                )
                if issue_type_id is None:
                    raise ValueError("Failed to retrieve existing 'AC' issue type ID")

                return issue_type_id
            else:
                print(f"Error creating 'AC' issue type: {e}")
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
        match payload.webhookEvent:
            case "jira:issue_created":
                self._on_stories_create(
                    connection_id=connection_id,
                    project_key=payload.issue.fields.project.key,
                    story_keys=[payload.issue.key],
                )
            case "jira:issue_updated":
                self._on_stories_update(
                    connection_id=connection_id,
                    project_key=payload.issue.fields.project.key,
                    story_keys=[payload.issue.key],
                )
            case "jira:issue_deleted":
                self._on_stories_delete(
                    connection_id=connection_id,
                    project_key=payload.issue.fields.project.key,
                    story_keys=[payload.issue.key],
                )

    def get_webhooks(self, connection_id: str):
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == connection_id)
            .first()
        )
        if not connection:
            raise ValueError("Connection not found")

        response = self.__exec_refreshing_access_token(
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

        self.__exec_refreshing_access_token(
            connection,
            JiraClient.delete_webhooks,
            cloud_id=connection.cloud_id,
            webhook_ids=[webhook_id],
        )
