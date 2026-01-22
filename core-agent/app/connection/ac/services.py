from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import Optional

from common.database import uuid_generator

from ..jira.models import GherkinAC
from .schemas import (
    ACCreateRequest,
    AIRequest,
    AISuggestion,
    AIResponse,
    ACSummary,
    ACDto,
)
from .agents import generate_ac_from_story
from app.connection.jira.models import Story, Project, Connection
from app.connection.jira.services import JiraService
from app.connection.jira.services.base_service import AC_ISSUE_TYPE_NAME
from app.connection.jira.schemas import IssueUpdate, StoryDto
from common.configs import GeminiConfig
from utils.markdown_adf_bridge import md_to_adf

from llm.dynamic_agent import GenimiDynamicAgent
from langchain_core.messages import SystemMessage, HumanMessage

system_prompt = """You are an expert Gherkin developer. Your goal is to provide suggestions to complete or improve the Gherkin feature file for a User Story.

You MUST output your suggestion in ONE of the following two formats:

Format 1: Search & Replace (Best for refactoring, fixing bugs, or rewriting blocks)
<<<<<<< SEARCH
[Exact copy of the code to find in the file]
=======
[The new code to write in its place]
>>>>>>> REPLACE

Format 2: Fill-In-The-Middle (Best for completions at the cursor)
<PRE> [Code Before Cursor] <SUF> [Code After Cursor] <MID>

(Note for Format 2: You must construct the PRE and SUF based on the cursor position context provided, and put your suggestion after <MID>. Do not close with </MID>).

RULES:
- Choose the most appropriate format. 
- Ensure valid Gherkin syntax.
- Return ONLY the suggestion in one of these formats. 
- Do not add markdown backticks around the block unless it's part of the code."""

suggestion_agent = GenimiDynamicAgent(
    system_prompt=system_prompt,
    model_name=GeminiConfig.GEMINI_API_CHAT_MODEL,
    temperature=0.2,
    api_keys=GeminiConfig.GEMINI_API_KEYS,
)


class ACService:
    def __init__(self, db: Session):
        self.db = db
        self.jira_service = JiraService(db)

    def _get_ac(self, connection_id: str, project_key: str, story_key: str, ac_id: str):
        return (
            self.db.query(GherkinAC)
            .join(Story, GherkinAC.story_id == Story.id)
            .join(Project, Story.project_id == Project.id)
            .join(Connection, Project.connection_id == Connection.id)
            .filter(
                Connection.id == connection_id,
                Project.key == project_key,
                Story.key == story_key,
                GherkinAC.id == ac_id,
            )
            .first()
        )

    def get_acs_by_story(
        self, user_id: str, connection_name: str, project_key: str, story_key: str
    ):
        acs = (
            self.db.query(GherkinAC, Story.key)
            .join(Story, GherkinAC.story_id == Story.id)
            .join(Project, Story.project_id == Project.id)
            .join(Connection, Project.connection_id == Connection.id)
            .filter(
                Connection.user_id == user_id,
                Connection.name == connection_name,
                Project.key == project_key,
                Story.key == story_key,
            )
            .all()
        )

        return [
            ACSummary(
                id=ac.id,
                key=ac.key,
                story_key=story_key,
                summary=ac.summary,
                created_at=ac.created_at,
                updated_at=ac.updated_at,
            )
            for ac, story_key in acs
        ]

    def get_acs_by_project(self, user_id: str, connection_name: str, project_key: str):
        acs = (
            self.db.query(GherkinAC, Story.key)
            .join(Story, GherkinAC.story_id == Story.id)
            .join(Project, Story.project_id == Project.id)
            .join(Connection, Project.connection_id == Connection.id)
            .filter(
                Connection.user_id == user_id,
                Connection.name == connection_name,
                Project.key == project_key,
            )
            .all()
        )

        return [
            ACSummary(
                id=ac.id,
                key=ac.key,
                story_key=story_key,
                summary=ac.summary,
                created_at=ac.created_at,
                updated_at=ac.updated_at,
            )
            for ac, story_key in acs
        ]

    def get_ac(
        self,
        user_id: str,
        connection_name: str,
        project_key: str,
        ac_id_or_key: str,
    ):
        ac = (
            self.db.query(GherkinAC, Story.key)
            .join(Story, GherkinAC.story_id == Story.id)
            .join(Project, Story.project_id == Project.id)
            .join(Connection, Project.connection_id == Connection.id)
            .filter(
                Connection.user_id == user_id,
                Connection.name == connection_name,
                Project.key == project_key,
                or_(GherkinAC.id == ac_id_or_key, GherkinAC.key == ac_id_or_key),
            )
            .first()
        )
        if not ac:
            raise ValueError("AC not found")
        ac, story_key = ac
        return ACDto(
            id=ac.id,
            key=ac.key,
            story_key=story_key,
            summary=ac.summary,
            description=ac.description,
            created_at=ac.created_at,
            updated_at=ac.updated_at,
        )

    def create_ac(
        self,
        connection_id: str,
        project_key: str,
        story_key: str,
        gen_with_ai: bool = False,
    ):
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

        if gen_with_ai:
            content = generate_ac_from_story(
                summary=story.summary,
                description=story.description or "",
            )
        else:
            content = (
                "Feature: New Feature \n  Scenario: \n    Given \n    When \n    Then "
            )

        ac_id = uuid_generator()
        new_ac = GherkinAC(
            id=ac_id,
            summary=content.splitlines()[0].replace("Feature: ", "").strip(),
            description=content,
            story_id=story.id,
        )
        self.db.add(new_ac)
        jira_issue_key = self._create_on_jira(
            connection_id, project_key, story_key, new_ac
        )
        if jira_issue_key:
            new_ac.key = jira_issue_key

        self.db.commit()

        return jira_issue_key if jira_issue_key else ac_id

    def _create_on_jira(
        self, connection_id: str, project_key: str, story_key: str, ac: GherkinAC
    ):
        try:
            # Convert content to ADF format
            description = md_to_adf(f"```gherkin\n{ac.description}\n```")

            issue_update = IssueUpdate(
                fields={
                    "project": {"key": project_key},
                    "parent": {"key": story_key},
                    "summary": ac.summary,
                    "description": description,
                    "issuetype": {"name": AC_ISSUE_TYPE_NAME},
                }
            )

            keys = self.jira_service.create_issues(connection_id, [issue_update])
            if keys:
                return keys[0]
            return None
        except Exception as e:
            print(f"Failed to create AC on Jira: {e}")
            return None

    def _update_on_jira(self, connection_id: str, project_key: str, ac: GherkinAC):
        if not ac.key:
            return  # Not linked to Jira
        try:
            self.jira_service.update_issue(
                connection_id,
                project_key,
                ac.key,
                summary=ac.summary,
                description=ac.description,
            )
        except Exception as e:
            print(f"Failed to update AC on Jira: {e}")

    def _get_ac_and_related(self, ac_id: str):
        result = (
            self.db.query(GherkinAC, Story, Project.key, Connection.id)
            .join(Story, GherkinAC.story_id == Story.id)
            .join(Project, Story.project_id == Project.id)
            .join(Connection, Project.connection_id == Connection.id)
            .filter(
                GherkinAC.id == ac_id,
            )
            .first()
        )

        if not result:
            raise ValueError("AC not found")

        return result

    def regenerate_ac(
        self,
        ac_id: str,
        content: str,
        feedback: Optional[str] = None,
    ):

        ac, story, project_key, connection_id = self._get_ac_and_related(ac_id)

        new_content = generate_ac_from_story(
            summary=story.summary,
            description=story.description or "",
            existing_ac=content,
            feedback=feedback,
        )
        ac.content = new_content
        self.db.commit()

        self._update_on_jira(connection_id, project_key, ac)

    def update_ac(
        self,
        ac_id: str,
        content: str,
    ):
        ac, story, project_key, connection_id = self._get_ac_and_related(ac_id)
        if not ac:
            raise ValueError("AC not found")
        ac.description = content
        self.db.commit()
        self._update_on_jira(connection_id, project_key, ac)

    def delete_ac(self, ac_id: str):
        ac, _, project_key, connection_id = self._get_ac_and_related(ac_id)
        if not ac:
            raise ValueError("AC not found")

        if ac.key:
            try:
                self.jira_service.delete_issue(connection_id, project_key, ac.key)
            except Exception as e:
                print(f"Failed to delete AC on Jira: {e}")

        self.db.delete(ac)
        self.db.commit()

    def get_story_by_ac(self, ac_id: str) -> StoryDto:
        story = (
            self.db.query(Story).join(GherkinAC).filter(GherkinAC.id == ac_id).first()
        )
        if not story:
            raise ValueError("Story not found")
        return StoryDto(
            id=story.id,
            key=story.key,
            summary=story.summary,
            description=story.description,
        )

    async def get_ai_suggestions(self, request: AIRequest) -> str:
        story = (
            self.db.query(Story)
            .join(GherkinAC)
            .filter(GherkinAC.id == request.ac_id)
            .first()
        )
        if not story:
            story_summary = "N/A"
            story_description = "N/A"
        else:
            story_summary = story.summary
            story_description = story.description or ""

        user_prompt = f"""
Story Summary:
{story_summary}
Story Description:
{story_description}

Current Gherkin Content:
{request.content}

Cursor is at Line: {request.cursor_line}, Column: {request.cursor_column}

Provide a useful suggestion following the given formats strictly.
"""

        try:
            result = suggestion_agent.invoke([HumanMessage(content=user_prompt)])

            messages = result.get("messages", [])
            if len(messages) > 1:
                return messages[1].content
            return ""

        except Exception as e:
            print(f"AI Error: {e}")
            return ""
