from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional
import tempfile
import os
import subprocess
import json

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
from app.connection.jira.models import JiraStory, JiraProject, JiraConnection
from app.connection.jira.services import JiraService
from app.connection.jira.services.base_service import AC_ISSUE_TYPE_NAME
from app.connection.jira.schemas import IssueUpdate
from common.configs import GeminiConfig
from utils.markdown_adf_bridge import md_to_adf

from llm.dynamic_agent import GenimiDynamicAgent
from langchain_core.messages import SystemMessage, HumanMessage


class ACService:
    def __init__(self, db: Session):
        self.db = db
        self.jira_service = JiraService(db)

    def _get_ac(self, connection_id: str, project_key: str, story_key: str, ac_id: str):
        return (
            self.db.query(GherkinAC)
            .join(JiraStory, GherkinAC.jira_story_id == JiraStory.id)
            .join(JiraProject, JiraStory.jira_project_id == JiraProject.id)
            .join(JiraConnection, JiraProject.jira_connection_id == JiraConnection.id)
            .filter(
                JiraConnection.id == connection_id,
                JiraProject.key == project_key,
                JiraStory.key == story_key,
                GherkinAC.id == ac_id,
            )
            .first()
        )

    def get_acs(self, connection_id: str, project_key: str, story_key: str):
        acs = (
            self.db.query(GherkinAC, JiraStory.key)
            .join(JiraStory, GherkinAC.jira_story_id == JiraStory.id)
            .join(JiraProject, JiraStory.jira_project_id == JiraProject.id)
            .join(JiraConnection, JiraProject.jira_connection_id == JiraConnection.id)
            .filter(
                JiraConnection.id == connection_id,
                JiraProject.key == project_key,
                JiraStory.key == story_key,
            )
            .all()
        )

        return [
            ACDto(
                id=ac.id,
                key=ac.key,
                story_key=story_key,
                summary=ac.summary,
                description=ac.description,
                created_at=ac.created_at,
                updated_at=ac.updated_at,
            )
            for ac, story_key in acs
        ]

    def get_ac(self, connection_id: str, project_key: str, story_key: str, ac_id: str):
        ac = (
            self.db.query(GherkinAC, JiraStory.key)
            .join(JiraStory, GherkinAC.jira_story_id == JiraStory.id)
            .join(JiraProject, JiraStory.jira_project_id == JiraProject.id)
            .join(JiraConnection, JiraProject.jira_connection_id == JiraConnection.id)
            .filter(
                JiraConnection.id == connection_id,
                JiraProject.key == project_key,
                JiraStory.key == story_key,
                GherkinAC.id == ac_id,
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

    def get_acs_by_project(self, connection_id: str, project_key: str):
        acs = (
            self.db.query(GherkinAC, JiraStory.key)
            .join(JiraStory, GherkinAC.jira_story_id == JiraStory.id)
            .join(JiraProject, JiraStory.jira_project_id == JiraProject.id)
            .join(JiraConnection, JiraProject.jira_connection_id == JiraConnection.id)
            .filter(
                JiraConnection.id == connection_id,
                JiraProject.key == project_key,
            )
            .all()
        )

        return [
            ACDto(
                id=ac.id,
                key=ac.key,
                story_key=story_key,
                summary=ac.summary,
                description=ac.description,
                created_at=ac.created_at,
                updated_at=ac.updated_at,
            )
            for ac, story_key in acs
        ]

    def create_ac(
        self,
        connection_id: str,
        project_key: str,
        story_key: str,
        gen_with_ai: bool = False,
    ):
        story = (
            self.db.query(JiraStory)
            .join(JiraProject, JiraStory.jira_project_id == JiraProject.id)
            .join(JiraConnection, JiraProject.jira_connection_id == JiraConnection.id)
            .filter(
                JiraConnection.id == connection_id,
                JiraProject.key == project_key,
                JiraStory.key == story_key,
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

        new_ac = GherkinAC(
            summary=content.splitlines()[0].replace("Feature: ", "").strip(),
            description=content,
            jira_story_id=story.id,
        )
        self.db.add(new_ac)
        self.db.commit()
        jira_issue_key = self._create_on_jira(
            connection_id, project_key, story_key, new_ac
        )
        if jira_issue_key:
            new_ac.jira_issue_key = jira_issue_key
            self.db.commit()
        self.db.refresh(new_ac)
        return new_ac.id

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

    def _update_on_jira(
        self, connection_id: str, project_key: str, story_key: str, ac: GherkinAC
    ):
        if not ac.jira_issue_key:
            return  # Not linked to Jira
        try:
            self.jira_service.update_issue(
                connection_id,
                project_key,
                ac.jira_issue_key,
                summary=ac.summary,
                description=ac.description,
            )
        except Exception as e:
            print(f"Failed to update AC on Jira: {e}")

    def regenerate_ac(
        self,
        connection_id: str,
        project_key: str,
        story_key: str,
        ac_id: str,
        content: str,
        feedback: Optional[str] = None,
    ):

        ac_and_story = (
            self.db.query(GherkinAC, JiraStory)
            .join(JiraStory, GherkinAC.jira_story_id == JiraStory.id)
            .join(JiraProject, JiraStory.jira_project_id == JiraProject.id)
            .join(JiraConnection, JiraProject.jira_connection_id == JiraConnection.id)
            .filter(
                JiraConnection.id == connection_id,
                JiraProject.key == project_key,
                JiraStory.key == story_key,
                GherkinAC.id == ac_id,
            )
            .first()
        )

        if not ac_and_story:
            raise ValueError("AC not found")

        ac, story = ac_and_story

        new_content = generate_ac_from_story(
            summary=story.summary,
            description=story.description or "",
            existing_ac=content,
            feedback=feedback,
        )
        ac.content = new_content
        self.db.commit()

        self._update_on_jira(connection_id, project_key, story_key, ac)

    def update_ac(
        self,
        connection_id: str,
        project_key: str,
        story_key: str,
        ac_id: str,
        content: str,
    ):
        ac = self._get_ac(connection_id, project_key, story_key, ac_id)
        if not ac:
            raise ValueError("AC not found")
        ac.description = content
        self.db.commit()
        self._update_on_jira(connection_id, project_key, story_key, ac)

    def delete_ac(
        self, connection_id: str, project_key: str, story_key: str, ac_id: str
    ):
        ac = self._get_ac(connection_id, project_key, story_key, ac_id)
        if not ac:
            raise ValueError("AC not found")

        if ac.key:
            try:
                self.jira_service.delete_story(connection_id, project_key, ac.key)
            except Exception as e:
                print(f"Failed to delete AC on Jira: {e}")

        self.db.delete(ac)
        self.db.commit()

    def lint_ac(self, content: str):
        # Write to temp file
        with tempfile.NamedTemporaryFile(
            suffix=".feature", delete=False, mode="w"
        ) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Run gherlint
            # gherlint usually outputs to stdout.
            result = subprocess.run(
                ["npx", "gherkin-lint", tmp_path, "--format", "json"],
                capture_output=True,
                text=True,
            )
            # Parse output. This depends on gherlint output format.
            # Assuming standard "file:line:col: message" or similar.
            # If gherlint is not installed or fails, return empty list or error string.
            output = result.stdout + result.stderr
            return output  # Return raw output for now to frontend to display
        except FileNotFoundError:
            import traceback

            traceback.print_exc()
            return "gherlint not installed"
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    async def get_ai_suggestions(self, request: AIRequest) -> AIResponse:
        story = (
            self.db.query(JiraStory).filter(JiraStory.key == request.story_key).first()
        )
        agent = GenimiDynamicAgent(
            system_prompt="You are an expert Gherkin developer. Provide suggestions to complete or improve the Gherkin feature file for a User Story. "
            "Return ONLY the suggestion content, or instructions.",
            model_name=GeminiConfig.GEMINI_API_CHAT_MODEL,
            temperature=0.2,
            api_keys=GeminiConfig.GEMINI_API_KEYS,
            response_schema=AIResponse,
            response_mime_type="application/json",
        )

        user_prompt = f"""
Story Summary:
{story.summary}
Story Description:
{story.description or 'N/A'}

Current Gherkin Content:
{request.content}

Cursor is at Line: {request.cursor_line}, Column: {request.cursor_column}

Provide 1-3 useful suggestions to complete the current line, add a new scenario, or fix an error.
Focus on valid Gherkin syntax (Given/When/Then).
"""

        try:
            result = agent.invoke([HumanMessage(content=user_prompt)])
            return result["structured_response"]
        except Exception as e:
            print(f"AI Error: {e}")
            return AIResponse(suggestions=[])
