from app.analysis.agents.schemas import DefectByLlm, UserStoryMinimal, DefectInput
from app.analysis.services.data_service import AnalysisDataService
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

    def run_analysis(self, analysis_id: str):
        analysis = self._get_analysis_or_raise(analysis_id)
        targeted = analysis.type == AnalysisType.TARGETED
        target_key = analysis.story_key if targeted else None

        try:
            self._start_analysis(analysis)

            stories = self._fetch_stories(analysis=analysis)

            if targeted:
                normalized_stories = []
                target = None
                for i in stories:
                    wi = UserStoryMinimal(
                        key=i.key,
                        summary=i.summary,
                        description=i.description or "",
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
            else:
                normalized_stories = [
                    UserStoryMinimal(
                        key=i.key,
                        summary=i.summary,
                        description=i.description or "",
                    )
                    for i in stories
                ]

            preference = self.pref_service.get_analysis_preference(
                connection_id=analysis.connection_id, project_key=analysis.project_key
            )

            initial_messages = self.doc_service.simulate_list_docs_messages(
                connection_id=analysis.connection_id,
                project_key=analysis.project_key,
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
                DefectInput(
                    id=d.key,
                    type=d.type.value,
                    severity=d.severity.value,
                    explanation=d.explanation,
                    confidence=d.confidence,
                    suggested_fix=d.suggested_fix,
                    story_keys=[w.story_key for w in d.story_keys],
                )
                for d in query.all()
            ]

            start = time.perf_counter()
            if targeted:
                defects = run_user_stories_analysis_target(
                    connection_id=analysis.connection_id,
                    project_key=analysis.project_key,
                    db=self.db,
                    target_user_story=target,
                    user_stories=normalized_stories,
                    existing_defects=existing_defects,
                    extra_prompt=preference.extra_prompt if preference else None,
                    initial_messages=initial_messages,
                )
                log_message = "Target story analysis completed in:"
            else:
                defects = run_user_stories_analysis_all(
                    connection_id=analysis.connection_id,
                    project_key=analysis.project_key,
                    db=self.db,
                    user_stories=normalized_stories,
                    existing_defects=existing_defects,
                    extra_prompt=preference.extra_prompt if preference else None,
                    initial_messages=initial_messages,
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
