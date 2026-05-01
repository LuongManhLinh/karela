from app.analysis.agents.schemas import DefectByLlm, StoryMinimal
from app.analysis.services.data_service import AnalysisDataService
from app.connection.jira.models import Project
from app.proposal.services.run_service import ProposalRunService

from app.documentation.services import DocumentationService
from app.preference.services import PreferenceService
from app.analysis.agents.all import (
    run_analysis as run_user_stories_analysis_all,
)
from app.analysis.agents.target import (
    run_analysis as run_user_stories_analysis_target,
)
from app.analysis.models import (
    Analysis,
    AnalysisStatus,
    AnalysisType,
    Defect,
    DefectSeverity,
    DefectType,
    DefectStoryKey,
)
from app.connection.jira.services import JiraService

from ..graphrag.agents import run_analysis_all, run_analysis_targeted
from ..graphrag.schemas import SingleDefectResponse, PairwiseDefectResponse

from sqlalchemy.orm import Session
from sqlalchemy import func, select


import time
import traceback
from datetime import datetime
from typing import Literal

from common.redis_app import redis_client
import json


class AnalysisRunService:
    def __init__(self, db: Session):
        self.db = db
        self.doc_service = DocumentationService(db=db)
        self.pref_service = PreferenceService(db=db)
        self.redis_client = redis_client
        self.jira_service = JiraService(db=db)

    def _publish_update(
        self,
        analysis_id: str,
        status: str,
        proposal_ids: list[str] = None,
        **kwargs,
    ):
        try:
            self.redis_client.publish(
                f"analysis:{analysis_id}",
                json.dumps(
                    {
                        "id": analysis_id,
                        "status": status,
                        "proposal_ids": proposal_ids,
                        **kwargs,
                    }
                ),
            )
        except Exception as e:
            print(f"Failed to publish update: {e}")

    def _publish_notification(
        self,
        connection_id: str,
        message: str,
        severity: Literal["info", "warning", "error", "success"] = "info",
    ):
        try:
            self.redis_client.publish(
                f"notification:{connection_id}",
                json.dumps({"message": message, "severity": severity}),
            )
        except Exception as e:
            print(f"Failed to publish notification: {e}")

    def _get_analysis_or_raise(self, analysis_id: str) -> Analysis:
        analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise ValueError(f"Analysis with id {analysis_id} not found")
        return analysis

    def _start_analysis(self, analysis: Analysis, status=AnalysisStatus.IN_PROGRESS):
        analysis.status = status
        self.db.add(analysis)
        self.db.commit()
        self._publish_update(
            analysis.id, status.value if hasattr(status, "value") else status
        )
        self._publish_notification(
            analysis.connection_id,
            f"Analysis {analysis.key} has started!",
            severity="info",
        )

    def _finish_analysis(
        self, analysis: Analysis, status: AnalysisStatus, error_msg: str = None
    ):
        analysis.status = status
        analysis.ended_at = datetime.now()
        if error_msg:
            analysis.error_message = error_msg
        self.db.commit()
        self._publish_update(
            analysis.id, status.value if hasattr(status, "value") else status
        )
        if status == AnalysisStatus.DONE:
            severity = "success"
        else:
            severity = "error"
        self._publish_notification(
            analysis.connection_id,
            f"Analysis {analysis.key} has finished!",
            severity=severity,
        )

    def _fetch_stories(self, analysis: Analysis):
        return self.jira_service.fetch_stories(
            connection_id=analysis.connection_id,
            project_key=analysis.project_key,
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
        self,
        analysis_id,
        defects: list[DefectByLlm],
        connection_id: str,
        project_key: str,
    ) -> list[Defect]:
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
                    story_keys=[
                        DefectStoryKey(story_key=key) for key in defect.story_keys
                    ],
                    analysis_id=analysis_id,
                )
            )
        self.db.commit()

    def _convert_graphrag_defects(
        self,
        analysis_id: str,
        self_defect_response: SingleDefectResponse,
        pairwise_defect_response: PairwiseDefectResponse,
        connection_id: str,
        project_key: str,
    ):
        """Convert graphrag SingleDefectResponse and PairwiseDefectResponse into Defect ORM objects."""
        count = self._count_defects(connection_id, project_key)
        idx = 0

        # Convert self (single-story) defects
        for case in self_defect_response.valid_defects:
            for defect in case.defects:
                self.db.add(
                    Defect(
                        key=f"{project_key}-DEF-{count + idx + 1}",
                        type=DefectType(defect.defect_type.upper()),
                        severity=DefectSeverity(defect.severity.upper()),
                        explanation=defect.explanation,
                        confidence=defect.confidence_score,
                        analysis_id=analysis_id,
                        story_keys=[
                            DefectStoryKey(story_key=case.story_key),
                        ],
                    )
                )
                idx += 1

        # Convert pairwise (cross-story) defects
        for case in pairwise_defect_response.valid_defects:
            for satellite in case.satellite_defects:
                self.db.add(
                    Defect(
                        key=f"{project_key}-DEF-{count + idx + 1}",
                        type=DefectType(satellite.defect_type.upper()),
                        severity=DefectSeverity(satellite.severity.upper()),
                        explanation=satellite.explanation,
                        confidence=satellite.confidence_score,
                        analysis_id=analysis_id,
                        story_keys=[
                            DefectStoryKey(story_key=case.anchor_story_key),
                            DefectStoryKey(story_key=satellite.story_key),
                        ],
                    )
                )
                idx += 1

    def run_analysis(self, analysis_id: str):
        start = time.perf_counter()
        analysis = self._get_analysis_or_raise(analysis_id)
        targeted = analysis.type == AnalysisType.TARGETED
        target_key = analysis.story_key if targeted else None

        try:
            self._start_analysis(analysis)

            if targeted:
                target = self.jira_service.fetch_stories(
                    connection_id=analysis.connection_id,
                    project_key=analysis.project_key,
                    story_keys=[target_key],
                )

                if not target:
                    self._finish_analysis(
                        analysis,
                        AnalysisStatus.FAILED,
                        error_msg=f"Target user story {target_key} not found",
                    )
                    return
                target = target[0]
                target = StoryMinimal(
                    key=target.key,
                    summary=target.summary,
                    description=target.description,
                )
            project_description = (
                self.db.query(Project.description)
                .filter(
                    Project.connection_id == analysis.connection_id,
                    Project.key == analysis.project_key,
                )
                .scalar()
            )

            print(
                f"Project description fetched: {bool(project_description)} characters"
            )

            preference = self.pref_service.get_analysis_preference(
                connection_id=analysis.connection_id, project_key=analysis.project_key
            )

            query = (
                self.db.query(Defect)
                .join(DefectStoryKey)
                .filter(
                    Defect.solved == False,
                )
                .join(Analysis)
                .filter(
                    Analysis.connection_id == analysis.connection_id,
                    Analysis.project_key == analysis.project_key,
                )
                .distinct()
            )

            if targeted:
                query = query.filter(DefectStoryKey.story_key == target_key)

            existing_defects = [
                DefectByLlm(
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    story_keys=[w.story_key for w in d.story_keys],
                )
                for d in query.all()
            ]

            if targeted:
                defects = run_user_stories_analysis_target(
                    connection_id=analysis.connection_id,
                    project_key=analysis.project_key,
                    target_user_story=target,
                    existing_defects=existing_defects,
                    extra_instruction=(
                        preference.extra_instruction if preference else None
                    ),
                    project_description=project_description,
                )
                log_message = "Target story analysis completed in:"
            else:
                defects = run_user_stories_analysis_all(
                    connection_id=analysis.connection_id,
                    project_key=analysis.project_key,
                    existing_defects=existing_defects,
                    extra_instruction=(
                        preference.extra_instruction if preference else None
                    ),
                    project_description=project_description,
                    self_concurrent_batches=5,
                    pairwise_concurrent_batches=5,
                )
                log_message = "User stories analysis completed in:"

            self._convert_llm_defects(
                analysis_id, defects, analysis.connection_id, analysis.project_key
            )

            print(
                log_message,
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            self._finish_analysis(analysis, AnalysisStatus.DONE)

            if preference and preference.gen_proposal_after_analysis:
                self._publish_notification(
                    analysis.connection_id,
                    "Generating proposals based on the analysis results...",
                    severity="info",
                )
                self.generate_proposals(analysis_id=analysis.id)
        except Exception:
            traceback.print_exc()
            self._finish_analysis(analysis, AnalysisStatus.FAILED)

    def generate_proposals(self, analysis_id: str):
        """Generate proposals for the given analysis.

        Args:
            analysis_id (str): The ID of the analysis to generate proposals for.
        Returns:
            list[str]: List of created proposal IDs.
        """
        analysis = self._get_analysis_or_raise(analysis_id)

        proposal_service = ProposalRunService(db=self.db)

        try:
            proposal_ids = proposal_service.generate_proposals(
                session_id=analysis_id,
                source="ANALYSIS",
                connection_id=analysis.connection_id,
                project_key=analysis.project_key,
                input_defects=analysis.defects,
            )

            self._publish_update(
                analysis_id,
                "PROPOSAL_DONE",
                proposal_ids=proposal_ids,
            )
            self._publish_notification(
                analysis.connection_id,
                f"Proposals for analysis {analysis.key} have been generated!",
            )
        finally:
            data_service = AnalysisDataService(db=self.db)
            data_service.set_generating_proposals(analysis_id, False)
