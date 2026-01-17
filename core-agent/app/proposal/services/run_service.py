from html2text import html2text
from sqlalchemy.orm import Session
from typing import Literal

from app.analysis.agents.schemas import DefectInput, WorkItemMinimal
from app.analysis.models import Defect
from app.connection import get_platform_service
from app.proposal.schemas import CreateProposalRequest, ProposeStoryRequest
from app.settings.services import SettingsService

from ..agents.graph import generate_proposals
from .data_service import ProposalService


class ProposalRunService:
    def __init__(self, db: Session):
        self.db = db
        self.settings_service = SettingsService(db=db)

    def _get_default_context_input(self, connection_id: str, project_key: str):
        return self.settings_service.get_agent_context_input(
            connection_id=connection_id, project_key=project_key
        )

    def _get_proposal_generation_inputs(
        self, connection_id, project_key, input_defects
    ):
        involved_story_keys = set()
        defects = []
        defect_key_id_map = {}
        for d in input_defects:
            if d.solved:
                continue
            keys = [w.key for w in d.story_keys]
            involved_story_keys.update(keys)
            defects.append(
                DefectInput(
                    id=d.key,
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    story_keys=keys,
                )
            )
            defect_key_id_map[d.key] = d.id
        if not defects:
            return []

        context_input = self._get_default_context_input(
            connection_id=connection_id,
            project_key=project_key,
        )

        jira_service = get_platform_service(db=self.db, connection_id=connection_id)

        jira_issues = jira_service.fetch_issues(
            connection_id=connection_id,
            jql=f"project = '{project_key}' AND key in ({', '.join(involved_story_keys)}) AND issuetype in (Story)",
            fields=["summary", "description"],
            max_results=len(involved_story_keys),
            expand_rendered_fields=True,
        )

        stories = [
            WorkItemMinimal(
                key=i.key,
                title=i.fields.summary,
                description=html2text(i.rendered_fields.description or ""),
            )
            for i in jira_issues
        ]

        return stories, defects, context_input, defect_key_id_map

    def generate_proposals(
        self,
        session_id: str,
        source: Literal["ANALYSIS", "CHAT"],
        connection_id: str,
        project_key: str,
        input_defects: list[Defect],
        clarifications: str = None,
        max_rewrite_attempts: int = 3,
    ) -> list:
        user_stories, defects, context_input, defect_key_id_map = (
            self._get_proposal_generation_inputs(
                connection_id=connection_id,
                project_key=project_key,
                input_defects=input_defects,
            )
        )

        if not user_stories or not defects:
            return []

        if context_input:
            context_input.clarifications = clarifications

        proposals = generate_proposals(
            defects=defects,
            user_stories=user_stories,
            context_input=context_input,
            max_rewrite_attempts=max_rewrite_attempts,
        )

        proposal_service = ProposalService(db=self.db)

        keys = proposal_service.create_proposals(
            proposal_requests=[
                CreateProposalRequest(
                    connection_id=connection_id,
                    source=source,
                    session_id=session_id,
                    project_key=project_key,
                    stories=[
                        ProposeStoryRequest(
                            key=s.story_key,
                            type=s.type,
                            summary=s.summary,
                            description=s.description,
                            explanation=s.explanation,
                        )
                        for s in p.contents
                    ],
                    target_defect_ids=[
                        defect_key_id_map[k] for k in p.target_defect_ids or []
                    ],
                )
                for p in proposals
            ]
        )

        return keys
