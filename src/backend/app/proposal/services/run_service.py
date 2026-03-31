from sqlalchemy.orm import Session
from typing import Literal

from app.analysis.agents.schemas import DefectInput, UserStoryMinimal
from app.analysis.models import Defect
from app.connection.jira.services import JiraService
from app.proposal.schemas import CreateProposalRequest, ProposeStoryRequest
from app.documentation.services import DocumentationService
from app.preference.services import PreferenceService

from ..agents.graph import generate_proposals
from .data_service import ProposalService


class ProposalRunService:
    def __init__(self, db: Session):
        self.db = db
        self.doc_service = DocumentationService(db=db)
        self.pref_service = PreferenceService(db=db)

        self.jira_service = JiraService(db=db)

    def _get_default_context_input(self, connection_id: str, project_key: str):
        return self.doc_service.get_agent_context_input(
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
            keys = [w.story_key for w in d.story_keys]
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
            return None

        context_input = self._get_default_context_input(
            connection_id=connection_id,
            project_key=project_key,
        )

        preference = self.pref_service.get_proposal_preference(
            connection_id=connection_id, project_key=project_key
        )

        stories = self.jira_service.fetch_stories(
            connection_id=connection_id,
            project_key=project_key,
            story_keys=list(involved_story_keys),
        )

        stories = [
            UserStoryMinimal(
                key=story.key,
                summary=story.summary,
                description=story.description,
            )
            for story in stories
        ]

        return stories, defects, context_input, preference, defect_key_id_map

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
        inputs = self._get_proposal_generation_inputs(
            connection_id=connection_id,
            project_key=project_key,
            input_defects=input_defects,
        )

        if not inputs:
            return []

        user_stories, defects, context_input, preference, defect_key_id_map = inputs

        if context_input:
            context_input.clarifications = clarifications

        proposals = generate_proposals(
            mode=preference.gen_proposal_mode if preference else "SIMPLE",
            defects=defects,
            user_stories=user_stories,
            context_input=context_input,
            max_rewrite_attempts=max_rewrite_attempts,
            extra_prompt=preference.gen_proposal_guidelines if preference else None,
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
