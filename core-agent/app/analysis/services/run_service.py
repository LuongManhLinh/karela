from app.analysis.agents.schemas import DefectByLlm, WorkItemMinimal
from app.analysis.agents.input_schemas import (
    ContextInput,
    Documentation,
    LlmContext,
)
from app.analysis.agents.story.all import (
    run_analysis as run_user_stories_analysis_all,
    run_analysis_async as run_user_stories_analysis_all_async,
)
from app.analysis.agents.story.target import (
    run_analysis as run_user_stories_analysis_target,
    run_analysis_async as run_user_stories_analysis_target_async,
)
from app.analysis.agents.proposal_generator.graph import generate_proposals
from app.analysis.models import (
    Analysis,
    AnalysisStatus,
    Defect,
    DefectSeverity,
    DefectType,
    DefectWorkItemId,
)
from app.integrations import get_platform_service
from app.proposal.services import ProposalService
from app.proposal.schemas import CreateProposalRequest, ProposeStoryRequest


from html2text import html2text
from sqlalchemy.orm import Session


import time
import traceback
from datetime import datetime
from typing import List

from app.settings.models import Settings


def get_default_context_input(
    db: Session, connection_id: str, project_key: str
) -> ContextInput:
    settings = (
        db.query(Settings)
        .filter(
            Settings.connection_id == connection_id,
            Settings.project_key == project_key,
        )
        .first()
    )
    if not settings:
        return ContextInput()

    return ContextInput(
        documentation=Documentation(
            product_vision=settings.product_vision,
            product_scope=settings.product_scope,
            sprint_goals=settings.current_sprint_goals,
            glossary=settings.glossary,
            constraints=settings.constraints,
            additional_docs=settings.additional_docs,
        ),
        llm_context=LlmContext(
            guidelines=settings.llm_guidelines,
        ),
    )


def _convert_llm_defects(defects: List[DefectByLlm]):
    return [
        Defect(
            type=DefectType(defect.type.upper()),
            severity=DefectSeverity(defect.severity.upper()),
            explanation=defect.explanation,
            confidence=defect.confidence,
            suggested_fix=defect.suggested_fix,
            work_item_ids=[DefectWorkItemId(key=key) for key in defect.work_item_keys],
        )
        for defect in defects
    ]


class DefectRunService:
    def __init__(self, db: Session):
        self.db = db

    def _get_analysis_or_raise(self, analysis_id: str) -> Analysis:
        analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise ValueError(f"Analysis with id {analysis_id} not found")
        return analysis

    def _start_analysis(self, analysis: Analysis, status=AnalysisStatus.IN_PROGRESS):
        analysis.status = status
        self.db.add(analysis)
        self.db.commit()

    def _finish_analysis(self, analysis: Analysis, status: AnalysisStatus):
        analysis.status = status
        analysis.ended_at = datetime.now()
        self.db.commit()

    def _fetch_issues(
        self, project_key: str, issue_types: List[str], connection_id: str
    ):
        return get_platform_service(
            db=self.db, connection_id=connection_id
        ).search_issues(
            connection_id=connection_id,
            jql=f"project = '{project_key}' AND issuetype in ({', '.join(issue_types)}) ORDER BY created ASC",
            fields=[
                "summary",
                "description",
                "issuetype",
            ],
            max_results=50,
            expand_rendered_fields=True,
        )

    # ---------------------------
    # ANALYZE ALL USER STORIES
    # ---------------------------

    def analyze_all_user_stories(self, analysis_id: str):
        analysis = self._get_analysis_or_raise(analysis_id)
        try:
            self._start_analysis(analysis)

            issues = self._fetch_issues(
                analysis.project_key, ["Story"], analysis.connection_id
            )
            user_stories = [
                WorkItemMinimal(
                    key=i.key,
                    title=i.fields.summary,
                    description=html2text(i.rendered_fields.description or ""),
                )
                for i in issues
            ]

            context_input = get_default_context_input(
                db=self.db,
                connection_id=analysis.connection_id,
                project_key=analysis.project_key,
            )
            existing_defects = [
                DefectByLlm(
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    work_item_keys=[w.key for w in d.work_item_ids],
                )
                for d in self.db.query(Defect)
                .join(Analysis)
                .filter(
                    Defect.solved == False, Analysis.project_key == analysis.project_key
                )
            ]

            start = time.perf_counter()
            defects = run_user_stories_analysis_all(
                user_stories=user_stories,
                context_input=context_input,
                existing_defects=existing_defects,
            )
            analysis.defects = _convert_llm_defects(defects)
            print(
                "User stories analysis completed in:",
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            self._finish_analysis(analysis, AnalysisStatus.DONE)
        except Exception:
            traceback.print_exc()
            self._finish_analysis(analysis, AnalysisStatus.FAILED)

    async def analyze_all_user_stories_async(self, analysis_id: str):
        analysis = self._get_analysis_or_raise(analysis_id)
        try:
            self._start_analysis(analysis)

            issues = self._fetch_issues(
                analysis.project_key, ["Story"], analysis.connection_id
            )
            user_stories = [
                WorkItemMinimal(
                    key=i.key,
                    title=i.fields.summary,
                    description=html2text(i.rendered_fields.description or ""),
                )
                for i in issues
            ]

            context_input = get_default_context_input(analysis.project_key)
            existing_defects = [
                DefectByLlm(
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    work_item_keys=[w.key for w in d.work_item_ids],
                )
                for d in self.db.query(Defect)
                .join(Analysis)
                .filter(
                    Defect.solved == False, Analysis.project_key == analysis.project_key
                )
            ]

            start = time.perf_counter()
            defects = await run_user_stories_analysis_all_async(
                user_stories=user_stories,
                context_input=context_input,
                existing_defects=existing_defects,
            )
            analysis.defects = _convert_llm_defects(defects)
            print(
                "User stories analysis (async) completed in:",
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            self._finish_analysis(analysis, AnalysisStatus.DONE)
        except Exception:
            traceback.print_exc()
            self._finish_analysis(analysis, AnalysisStatus.FAILED)

    # ---------------------------
    # ANALYZE TARGET STORY (sync + async)
    # ---------------------------

    def analyze_target_user_story(self, analysis_id: str, target_key: str):
        analysis = self._get_analysis_or_raise(analysis_id)
        try:
            self._start_analysis(analysis)

            issues = self._fetch_issues(
                analysis.project_key, ["Story"], analysis.connection_id
            )

            user_stories = []
            target = None
            for i in issues:
                wi = WorkItemMinimal(
                    key=i.key,
                    title=i.fields.summary,
                    description=html2text(i.rendered_fields.description or ""),
                )
                (target := wi) if wi.key == target_key else user_stories.append(wi)

            if not target:
                raise ValueError(f"Target user story {target_key} not found")

            context_input = get_default_context_input(
                db=self.db,
                connection_id=analysis.connection_id,
                project_key=analysis.project_key,
            )
            existing_defects = [
                DefectByLlm(
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    work_item_keys=[w.key for w in d.work_item_ids],
                )
                for d in self.db.query(Defect)
                .join(DefectWorkItemId)
                .filter(DefectWorkItemId.key == target_key, Defect.solved == False)
                .distinct()
            ]

            start = time.perf_counter()
            defects = run_user_stories_analysis_target(
                target_user_story=target,
                user_stories=user_stories,
                context_input=context_input,
                existing_defects=existing_defects,
            )

            analysis.defects = _convert_llm_defects(defects)
            print(
                "Target story analysis completed in:",
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            self._finish_analysis(analysis, AnalysisStatus.DONE)
        except Exception:
            traceback.print_exc()
            self._finish_analysis(analysis, AnalysisStatus.FAILED)

    async def analyze_target_user_story_async(self, analysis_id: str, target_key: str):
        analysis = self._get_analysis_or_raise(analysis_id)
        try:
            self._start_analysis(analysis)

            issues = self._fetch_issues(
                analysis.project_key, ["Story"], analysis.connection_id
            )
            user_stories = []
            target = None
            for i in issues:
                wi = WorkItemMinimal(
                    key=i.key,
                    title=i.fields.summary,
                    description=html2text(i.rendered_fields.description or ""),
                )
                (target := wi) if wi.key == target_key else user_stories.append(wi)

            if not target:
                raise ValueError(f"Target user story {target_key} not found")

            context_input = get_default_context_input(analysis.project_key)
            existing_defects = [
                DefectByLlm(
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    work_item_keys=[w.key for w in d.work_item_ids],
                )
                for d in self.db.query(Defect)
                .join(DefectWorkItemId)
                .filter(DefectWorkItemId.key == target_key, Defect.solved == False)
                .distinct()
            ]

            start = time.perf_counter()
            defects = await run_user_stories_analysis_target_async(
                user_stories=user_stories,
                target_user_story_key=target_key,
                context_input=context_input,
                existing_defects=existing_defects,
            )

            analysis.defects = _convert_llm_defects(defects)
            print(
                "Target story analysis (async) completed in:",
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            self._finish_analysis(analysis, AnalysisStatus.DONE)
        except Exception:
            traceback.print_exc()
            self._finish_analysis(analysis, AnalysisStatus.FAILED)

    def generate_proposals(self, analysis_id: str):
        """Generate proposals for the given analysis.

        Args:
            analysis_id (str): The ID of the analysis to generate proposals for.
        Returns:
            List[str]: List of created proposal IDs.
        """
        analysis = self._get_analysis_or_raise(analysis_id)
        involved_story_keys = set()
        defects = []

        for d in analysis.defects:
            keys = [w.key for w in d.work_item_ids]
            involved_story_keys.update(keys)
            defects.append(
                DefectByLlm(
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    work_item_keys=keys,
                )
            )

        context_input = get_default_context_input(
            db=self.db,
            connection_id=analysis.connection_id,
            project_key=analysis.project_key,
        )

        jira_service = get_platform_service(
            db=self.db, connection_id=analysis.connection_id
        )

        jira_issues = jira_service.search_issues(
            connection_id=analysis.connection_id,
            jql=f"project = '{analysis.project_key}' AND key in ({', '.join(involved_story_keys)}) AND issuetype in (Story)",
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

        proposals = generate_proposals(
            defects=defects,
            user_stories=stories,
            context_input=context_input,
        )

        proposal_service = ProposalService(db=self.db)
        proposal_ids = []
        for p in proposals:
            proposal_req = CreateProposalRequest(
                connection_id=analysis.connection_id,
                source="ANALYSIS",
                session_id=analysis.id,
                project_key=analysis.project_key,
                stories=[
                    ProposeStoryRequest(
                        key=s.key,
                        type=s.type,
                        summary=s.summary,
                        description=s.description,
                        explanation=s.explanation,
                    )
                    for s in p.contents
                ],
            )
            proposal_ids.append(proposal_service.create_proposal(proposal_req))

        return proposal_ids
