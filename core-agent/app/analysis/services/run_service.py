from app.analysis.agents.schemas import DefectByLlm, WorkItemMinimal, DefectInput
from common.agents.input_schemas import (
    Documentation,
)
from app.analysis.agents.all import (
    run_analysis as run_user_stories_analysis_all,
    run_analysis_async as run_user_stories_analysis_all_async,
    stream_analysis as stream_user_stories_analysis_all,
)
from app.analysis.agents.target import (
    run_analysis as run_user_stories_analysis_target,
    run_analysis_async as run_user_stories_analysis_target_async,
    stream_analysis as stream_user_stories_analysis_target,
)
from app.proposal.agents.graph import generate_proposals
from app.analysis.models import (
    Analysis,
    AnalysisType,
    AnalysisStatus,
    Defect,
    DefectSeverity,
    DefectType,
    DefectStoryKey,
)
from app.integrations import get_platform_service
from app.proposal.services import ProposalService
from app.proposal.schemas import CreateProposalRequest, ProposeStoryRequest


from html2text import html2text
from sqlalchemy.orm import Session
from sqlalchemy import func, select


import time
import traceback
from datetime import datetime
from typing import List, Optional, Literal

from app.settings.models import Settings
from common.agents.input_schemas import ContextInput, LlmContext
from common.database import uuid_generator


class AnalysisRunService:
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

    def _get_default_context_input(
        self, connection_id: str, project_key: str
    ) -> ContextInput:
        settings = (
            self.db.query(Settings)
            .filter(
                Settings.connection_id == connection_id,
                Settings.project_key == project_key,
            )
            .first()
        )
        if not settings:
            return None

        # Return None if all the fields are empty
        if not any(
            [
                settings.product_vision,
                settings.product_scope,
                settings.current_sprint_goals,
                settings.glossary,
                settings.constraints,
                settings.additional_docs,
                settings.llm_guidelines,
            ]
        ):
            return None

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

    def _finish_analysis(
        self, analysis: Analysis, status: AnalysisStatus, error_msg: str = None
    ):
        analysis.status = status
        analysis.ended_at = datetime.now()
        if error_msg:
            analysis.error_message = error_msg
        self.db.commit()

    def _fetch_issues(
        self, project_key: str, issue_types: List[str], connection_id: str
    ):
        return get_platform_service(
            db=self.db, connection_id=connection_id
        ).fetch_issues(
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

    def _count_defects(self, connection_id: str, project_key: str) -> int:
        stmt = (
            select(func.count(Defect.id))
            .join(Analysis)
            .filter(
                Analysis.connection_id == connection_id,
                Analysis.project_key == project_key,
            )
        )

        return self.db.execute(stmt).scalar_one()

    def _convert_llm_defects(
        self, defects: List[DefectByLlm], connection_id: str, project_key: str
    ) -> List[Defect]:
        count = self._count_defects(connection_id, project_key)
        return [
            Defect(
                key=f"{project_key}-DEF-{count + idx + 1}",
                type=DefectType(defect.type.upper()),
                severity=DefectSeverity(defect.severity.upper()),
                explanation=defect.explanation,
                confidence=defect.confidence,
                suggested_fix=defect.suggested_fix,
                story_keys=[DefectStoryKey(key=key) for key in defect.story_keys],
            )
            for idx, defect in enumerate(defects)
        ]

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

            context_input = self._get_default_context_input(
                connection_id=analysis.connection_id,
                project_key=analysis.project_key,
            )
            existing_defects = [
                DefectInput(
                    id=d.key,
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    story_keys=[w.key for w in d.story_keys],
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
            analysis.defects = self._convert_llm_defects(
                defects, analysis.connection_id, analysis.project_key
            )
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

            context_input = self._get_default_context_input(
                connection_id=analysis.connection_id,
                project_key=analysis.project_key,
            )
            existing_defects = [
                DefectInput(
                    id=d.key,
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    story_keys=[w.key for w in d.story_keys],
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
            analysis.defects = self._convert_llm_defects(
                defects, analysis.connection_id, analysis.project_key
            )
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

    def analyze_target_user_story(self, analysis_id: str):
        analysis = self._get_analysis_or_raise(analysis_id)
        target_key = analysis.story_key
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

            context_input = self._get_default_context_input(
                connection_id=analysis.connection_id,
                project_key=analysis.project_key,
            )
            existing_defects = [
                DefectInput(
                    id=d.key,
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    story_keys=[w.key for w in d.story_keys],
                )
                for d in self.db.query(Defect)
                .join(DefectStoryKey)
                .filter(DefectStoryKey.key == target_key, Defect.solved == False)
                .distinct()
            ]

            start = time.perf_counter()
            defects = run_user_stories_analysis_target(
                target_user_story=target,
                user_stories=user_stories,
                context_input=context_input,
                existing_defects=existing_defects,
            )

            analysis.defects = self._convert_llm_defects(
                defects, analysis.connection_id, analysis.project_key
            )
            print(
                "Target story analysis completed in:",
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            self._finish_analysis(analysis, AnalysisStatus.DONE)
        except Exception:
            traceback.print_exc()
            self._finish_analysis(analysis, AnalysisStatus.FAILED)

    async def analyze_target_user_story_async(self, analysis_id: str):
        analysis = self._get_analysis_or_raise(analysis_id)
        target_key = analysis.story_key
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

            context_input = self._get_default_context_input(analysis.project_key)
            existing_defects = [
                DefectInput(
                    id=d.key,
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    story_keys=[w.key for w in d.story_keys],
                )
                for d in self.db.query(Defect)
                .join(DefectStoryKey)
                .filter(DefectStoryKey.key == target_key, Defect.solved == False)
                .distinct()
            ]

            start = time.perf_counter()
            defects = await run_user_stories_analysis_target_async(
                user_stories=user_stories,
                target_user_story_key=target_key,
                context_input=context_input,
                existing_defects=existing_defects,
            )

            analysis.defects = self._convert_llm_defects(
                defects, analysis.connection_id, analysis.project_key
            )
            print(
                "Target story analysis (async) completed in:",
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            self._finish_analysis(analysis, AnalysisStatus.DONE)
        except Exception:
            traceback.print_exc()
            self._finish_analysis(analysis, AnalysisStatus.FAILED)

    async def stream_target_user_story_analysis(
        self,
        connection_id: str,
        project_key: str,
        analysis_type: Literal["TARGETED", "ALL"],
        target_key: Optional[str] = None,
    ):
        analysis_id = uuid_generator()
        analysis = Analysis(
            id=analysis_id,
            project_key=project_key,
            type=AnalysisType(analysis_type),
            status=AnalysisStatus.PENDING,
            connection_id=connection_id,
            started_at=datetime.now(),
            story_key=target_key,
        )

        self.db.add(analysis)
        self.db.commit()
        try:
            self._start_analysis(analysis)

            yield {
                "status": "IN_PROGRESS",
                "message": "Fetching issues...",
                "id": analysis_id,
            }

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

            yield {"message": "Running analysis..."}
            context_input = self._get_default_context_input(
                connection_id=connection_id,
                project_key=project_key,
            )
            existing_defects = [
                DefectInput(
                    id=d.key,
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    story_keys=[w.key for w in d.story_keys],
                )
                for d in self.db.query(Defect)
                .join(DefectStoryKey)
                .filter(DefectStoryKey.key == target_key, Defect.solved == False)
                .distinct()
            ]

            start = time.perf_counter()
            for step in stream_user_stories_analysis_target(
                user_stories=user_stories,
                target_user_story=target,
                context_input=context_input,
                existing_defects=existing_defects,
            ):
                if "data" in step:
                    defects = step["data"]
                    analysis.defects = self._convert_llm_defects(
                        defects, analysis.connection_id, analysis.project_key
                    )
                else:
                    yield step
            print(
                "Target story analysis (async) completed in:",
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            self._finish_analysis(analysis, AnalysisStatus.DONE)
            yield {"status": "DONE"}
        except Exception as e:
            traceback.print_exc()
            error_msg = str(e)
            self._finish_analysis(analysis, AnalysisStatus.FAILED, error_msg=error_msg)
            yield {"status": "FAILED", "message": error_msg}

    async def stream_all_user_stories_analysis(
        self,
        connection_id: str,
        project_key: str,
        analysis_type: Literal["TARGETED", "ALL"],
    ):
        analysis_id = uuid_generator()
        analysis = Analysis(
            id=analysis_id,
            project_key=project_key,
            type=AnalysisType(analysis_type),
            status=AnalysisStatus.PENDING,
            connection_id=connection_id,
            started_at=datetime.now(),
        )

        self.db.add(analysis)
        self.db.commit()

        try:
            self._start_analysis(analysis)

            yield {
                "status": "IN_PROGRESS",
                "message": "Fetching issues...",
                "id": analysis_id,
            }

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

            yield {"message": "Running analysis...", "id": analysis_id}
            context_input = self._get_default_context_input(
                connection_id=connection_id,
                project_key=project_key,
            )
            existing_defects = [
                DefectInput(
                    id=d.key,
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    story_keys=[w.key for w in d.story_keys],
                )
                for d in self.db.query(Defect)
                .join(Analysis)
                .filter(
                    Defect.solved == False, Analysis.project_key == analysis.project_key
                )
            ]

            start = time.perf_counter()
            for step in stream_user_stories_analysis_all(
                user_stories=user_stories,
                context_input=context_input,
                existing_defects=existing_defects,
            ):
                if "data" in step:
                    defects = step["data"]
                    analysis.defects = self._convert_llm_defects(
                        defects, analysis.connection_id, analysis.project_key
                    )
                else:
                    step["id"] = analysis_id
                    yield step
            print(
                "All user stories analysis (async) completed in:",
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            self._finish_analysis(analysis, AnalysisStatus.DONE)
            yield {"status": "DONE", "id": analysis_id}
        except Exception as e:
            traceback.print_exc()
            error_msg = str(e)
            self._finish_analysis(analysis, AnalysisStatus.FAILED, error_msg=error_msg)
            yield {"status": "FAILED", "message": error_msg, "id": analysis_id}

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
        defect_key_id_map = {}
        for d in analysis.defects:
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
            print("No unsolved defects found for analysis:", analysis_id)
            return []

        context_input = self._get_default_context_input(
            connection_id=analysis.connection_id,
            project_key=analysis.project_key,
        )

        jira_service = get_platform_service(
            db=self.db, connection_id=analysis.connection_id
        )

        jira_issues = jira_service.fetch_issues(
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

        proposal_ids = proposal_service.create_proposals(
            proposal_requests=[
                CreateProposalRequest(
                    connection_id=analysis.connection_id,
                    source="ANALYSIS",
                    session_id=analysis.id,
                    project_key=analysis.project_key,
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

        return proposal_ids
