from app.analysis.agents.schemas import DefectByLlm, WorkItemMinimal, DefectInput
from app.proposal.services.run_service import ProposalRunService
from app.settings.services import SettingsService
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
from app.analysis.models import (
    Analysis,
    AnalysisType,
    AnalysisStatus,
    Defect,
    DefectSeverity,
    DefectType,
    DefectStoryKey,
)
from app.connection import get_platform_service


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
        self.settings_service = SettingsService(db=db)

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
        return self.settings_service.get_agent_context_input(
            connection_id=connection_id, project_key=project_key
        )

    def _finish_analysis(
        self, analysis: Analysis, status: AnalysisStatus, error_msg: str = None
    ):
        analysis.status = status
        analysis.ended_at = datetime.now()
        if error_msg:
            analysis.error_message = error_msg
        self.db.commit()

    def _fetch_stories(self, connection_id: str, project_key: str):
        return get_platform_service(
            db=self.db, connection_id=connection_id
        ).fetch_stories(connection_id=connection_id, project_key=project_key)

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
        self,
        analysis_id,
        defects: List[DefectByLlm],
        connection_id: str,
        project_key: str,
    ) -> List[Defect]:
        count = self._count_defects(connection_id, project_key)

        for idx, defect in enumerate(defects):
            self.db.add(
                Defect(
                    key=f"{project_key}-DEF-{count + idx + 1}",
                    type=DefectType(defect.type.upper()),
                    severity=DefectSeverity(defect.severity.upper()),
                    explanation=defect.explanation,
                    confidence=defect.confidence,
                    suggested_fix=defect.suggested_fix,
                    story_keys=[DefectStoryKey(key=key) for key in defect.story_keys],
                    analysis_id=analysis_id,
                )
            )

    # ---------------------------
    # ANALYZE ALL USER STORIES
    # ---------------------------

    def analyze_all_user_stories(self, analysis_id: str):
        analysis = self._get_analysis_or_raise(analysis_id)
        try:
            self._start_analysis(analysis)

            stories = self._fetch_stories(
                connection_id=analysis.connection_id,
                project_key=analysis.project_key,
            )
            normalized_stories = [
                WorkItemMinimal(
                    key=i.key,
                    title=i.summary,
                    description=i.description or "",
                )
                for i in stories
            ]

            context_input = self._get_default_context_input(
                connection_id=analysis.connection_id,
                project_key=analysis.project_key,
            )
            # existing_defects = [
            #     DefectInput(
            #         id=d.key,
            #         type=d.type.value,
            #         severity=d.severity.value,
            #         explanation=d.explanation,
            #         confidence=d.confidence,
            #         suggested_fix=d.suggested_fix,
            #         story_keys=[w.key for w in d.story_keys],
            #     )
            #     for d in self.db.query(Defect)
            #     .join(Analysis)
            #     .filter(Defect.solved == False)
            #     .filter(
            #         Analysis.connection_id == analysis.connection_id,
            #         Analysis.project_key == analysis.project_key,
            #     )
            #     .all()
            # ]

            existing_defects = []

            print("Found existing defects:", len(existing_defects))

            start = time.perf_counter()
            defects = run_user_stories_analysis_all(
                user_stories=normalized_stories,
                context_input=context_input,
                existing_defects=existing_defects,
            )

            # Append new defects to existing ones

            self._convert_llm_defects(
                analysis_id, defects, analysis.connection_id, analysis.project_key
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

    # ---------------------------
    # ANALYZE TARGET STORY (sync + async)
    # ---------------------------

    def analyze_target_user_story(self, analysis_id: str):
        analysis = self._get_analysis_or_raise(analysis_id)
        target_key = analysis.story_key
        try:
            self._start_analysis(analysis)

            stories = self._fetch_stories(
                connection_id=analysis.connection_id,
                project_key=analysis.project_key,
            )

            normalized_stories = []
            target = None
            for i in stories:
                wi = WorkItemMinimal(
                    key=i.key, title=i.summary, description=i.description or ""
                )

                if wi.key == target_key:
                    target = wi
                else:
                    normalized_stories.append(wi)

            if not target:
                self._finish_analysis(
                    analysis,
                    AnalysisStatus.FAILED,
                    error_msg=f"Target user story {target_key} not found",
                )
                return

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
                .join(Analysis)
                .filter(
                    Analysis.connection_id == analysis.connection_id,
                    Analysis.project_key == analysis.project_key,
                )
                .distinct()
                .all()
            ]

            start = time.perf_counter()
            defects = run_user_stories_analysis_target(
                target_user_story=target,
                user_stories=normalized_stories,
                context_input=context_input,
                existing_defects=existing_defects,
            )

            self._convert_llm_defects(
                analysis_id, defects, analysis.connection_id, analysis.project_key
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

            stories = self._fetch_stories(
                connection_id=connection_id,
                project_key=project_key,
            )
            normalized_stories = []
            target = None
            for i in stories:
                wi = WorkItemMinimal(
                    key=i.key, title=i.summary, description=i.description or ""
                )

                if wi.key == target_key:
                    target = wi
                else:
                    normalized_stories.append(wi)

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
                user_stories=normalized_stories,
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

            stories = self._fetch_stories(
                connection_id=connection_id,
                project_key=project_key,
            )
            normalized_stories = [
                WorkItemMinimal(
                    key=i.key,
                    title=i.summary,
                    description=i.description or "",
                )
                for i in stories
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
                user_stories=normalized_stories,
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

        proposal_service = ProposalRunService(db=self.db)

        proposal_ids = proposal_service.generate_proposals(
            session_id=analysis_id,
            source="ANALYSIS",
            connection_id=analysis.connection_id,
            project_key=analysis.project_key,
            input_defects=analysis.defects,
        )

        return proposal_ids
