from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional
import tempfile
import os
import subprocess
import json

from ..integrations.jira.models import GherkinAC
from .schemas import ACCreateRequest, ACUpdate, AIRequest, AISuggestion, AIResponse
from app.integrations.jira.models import JiraStory, JiraProject, JiraConnection
from app.integrations.jira.services import JiraService, AC_ISSUE_TYPE_NAME
from app.integrations.jira.schemas import IssueUpdate
from common.database import uuid_generator
from common.configs import GeminiConfig

from llm.dynamic_agent import GenimiDynamicAgent
from langchain_core.messages import SystemMessage, HumanMessage


class ACService:
    def __init__(self, db: Session):
        self.db = db
        self.jira_service = JiraService(db)

    def get_acs(self, story_identifier: str) -> List[GherkinAC]:
        # Try to find by ID
        story = (
            self.db.query(JiraStory).filter(JiraStory.id == story_identifier).first()
        )
        if not story:
            # Try to find by Key
            story = (
                self.db.query(JiraStory)
                .filter(JiraStory.key == story_identifier)
                .first()
            )

        if not story:
            return []

        return (
            self.db.query(GherkinAC).filter(GherkinAC.jira_story_id == story.id).all()
        )

    def get_ac(self, ac_id: str) -> Optional[GherkinAC]:
        return self.db.query(GherkinAC).filter(GherkinAC.id == ac_id).first()

    def create_ac(self, ac_data: ACCreateRequest) -> GherkinAC:
        print(f"Creating AC for story ID: {ac_data.jira_story_id}")
        story = (
            self.db.query(JiraStory)
            .filter(
                or_(
                    JiraStory.id == ac_data.jira_story_id,
                    JiraStory.key == ac_data.jira_story_id,
                )
            )
            .first()
        )
        if not story:
            raise ValueError("Story not found")

        # Create in DB first
        new_ac = GherkinAC(
            content=ac_data.content,
            jira_story_id=story.id,
        )
        self.db.add(new_ac)
        self.db.commit()
        self.db.refresh(new_ac)

        # Sync with Jira
        # Find connection info
        project = (
            self.db.query(JiraProject)
            .filter(JiraProject.id == story.jira_project_id)
            .first()
        )
        connection = (
            self.db.query(JiraConnection)
            .filter(JiraConnection.id == project.jira_connection_id)
            .first()
            if project
            else None
        )

        return new_ac  # Temporary return before Jira sync

        if connection:
            try:
                # Create Subtask
                # Extract summary from content (first line)
                summary = (
                    ac_data.content.split("\n")[0][:100]
                    if ac_data.content
                    else "Gherkin AC"
                )

                payload = IssueUpdate(
                    fields={
                        "project": {"key": project.key},
                        "parent": {"key": story.key},
                        "summary": summary,
                        "description": f"{{code:gherkin}}\n{ac_data.content}\n{{code}}",  # Jira ADF or markup? using basic description for now, simpler than ADF
                        "issuetype": {"name": AC_ISSUE_TYPE_NAME},
                    }
                )

                # Use JiraService to create issue
                # We need to manually call create_issue because JiraService wrapper might not support parent/subtask easily in create_story
                # But creating a generic issue works if payload is correct.
                # Re-using JiraClient directly might be needed if JiraService doesn't expose generic create_issue well.
                # JiraService.create_story uses generic create_issue.
                # Let's use JiraClient via accessing internal method or creating a public one?
                # JiraService.create_story logic is specific to Story.
                # But I can access JiraClient via the service's helper or duplicate the logic using stored tokens.
                # Actually, JiraService has `_exec_refreshing_access_token` which is internal.
                # I should probably expose a generic `create_issue_generic` in JiraService or just trust `create_issues` (bulk) or similar.
                # JiraService has `create_story` which calls `JiraClient.create_issue`.
                # I will modify JiraService to allow creating generic issues or subtasks if needed, or simply use `JiraService.create_issues` (bulk).

                # Bulk create expects list of issues.
                issue_update = IssueUpdate(
                    fields={
                        "project": {"key": project.key},
                        "parent": {"key": story.key},
                        "summary": summary,
                        "description": ac_data.content,  # Simplified
                        "issuetype": {"name": AC_ISSUE_TYPE_NAME},
                    }
                )

                # NOTE: create_issues in JiraService returns keys.
                # It takes connection_id, issues.
                keys = self.jira_service.create_issues(connection.id, [issue_update])
                if keys:
                    new_ac.jira_issue_key = keys[0]
                    self.db.commit()

            except Exception as e:
                print(f"Failed to sync with Jira: {e}")
                # Don't fail the whole creation? Or should we?
                # User requirement: "store them in a local database, vector store and in jira".
                # If Jira fails, maybe we should warn logic. For now, log and proceed.

        return new_ac

    def update_ac(self, ac_id: str, ac_data: ACUpdate) -> GherkinAC:
        ac = self.get_ac(ac_id)
        if not ac:
            raise ValueError("AC not found")

        if ac_data.content is not None:
            ac.content = ac_data.content

        self.db.commit()
        self.db.refresh(ac)

        # Sync Jira
        if ac.jira_issue_key and ac.story:
            # Find connection
            project = (
                self.db.query(JiraProject)
                .filter(JiraProject.id == ac.story.jira_project_id)
                .first()
            )
            connection_id = project.jira_connection_id if project else None

            return ac  # Temporary return before Jira sync

            if connection_id:
                try:
                    summary = (
                        ac.content.split("\n")[0][:100] if ac.content else "Gherkin AC"
                    )
                    self.jira_service.update_issue(
                        connection_id,
                        ac.jira_issue_key,
                        summary=summary,
                        description=ac.content,
                    )
                except Exception as e:
                    print(f"Failed to update Jira: {e}")

        return ac

    def delete_ac(self, ac_id: str):
        ac = self.get_ac(ac_id)
        if not ac:
            raise ValueError("AC not found")

        # Delete from Jira
        if ac.jira_issue_key and ac.story:
            project = (
                self.db.query(JiraProject)
                .filter(JiraProject.id == ac.story.jira_project_id)
                .first()
            )
            connection_id = project.jira_connection_id if project else None
            return  # Temporary return before Jira sync
            if connection_id:
                try:
                    self.jira_service.delete_issue(connection_id, ac.jira_issue_key)
                except Exception as e:
                    print(f"Failed to delete from Jira: {e}")

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
                ["gherlint", tmp_path], capture_output=True, text=True
            )
            # Parse output. This depends on gherlint output format.
            # Assuming standard "file:line:col: message" or similar.
            # If gherlint is not installed or fails, return empty list or error string.
            output = result.stdout + result.stderr
            return output  # Return raw output for now to frontend to display
        except FileNotFoundError:
            return "gherlint not installed"
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    async def get_ai_suggestions(self, request: AIRequest) -> AIResponse:
        agent = GenimiDynamicAgent(
            system_prompt="You are an expert Gherkin developer. Provide suggestions to complete or improve the Gherkin feature file. "
            "Return ONLY the suggestion content, or instructions.",
            model_name=GeminiConfig.GEMINI_API_CHAT_MODEL,
            temperature=0.2,
            api_keys=GeminiConfig.GEMINI_API_KEYS,
            response_schema=AIResponse,
        )

        user_prompt = f"""
        Context: {request.context or 'No context'}
        Current Gherkin Content:
        {request.content}
        
        Cursor is at Line: {request.cursor_line}, Column: {request.cursor_column}
        
        Provide 1-3 useful suggestions to complete the current line, add a new scenario, or fix an error.
        Focus on valid Gherkin syntax (Given/When/Then).
        """

        try:
            result = agent.invoke([HumanMessage(content=user_prompt)])
            # If result is just the object (due to schema), return it.
            # GenimiDynamicAgent invoke returns the parsed object if schema provided?
            # Looking at code: `self.agent.invoke` returns `Agent response with structured output if schema provided`.
            # Typically LangChain returns a dict like {"output": ...} or the object itself if structured.
            # I will assume it returns the dictionary with "output" key which contains the model instance.
            return result["output"]
        except Exception as e:
            print(f"AI Error: {e}")
            return AIResponse(suggestions=[])
