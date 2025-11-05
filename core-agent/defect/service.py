from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4
import time
from datetime import datetime
from html2text import html2text

from .models import (
    DefectWorkItemId,
    Defect,
    DefectType,
    DefectSeverity,
    Analysis,
    AnalysisDetail,
    AnalysisType,
    AnalysisStatus,
)
from .agents.general_schemas import WorkItemWithRef, DefectByLlm
from .agents.input_schemas import ContextInput, Documentation
from .agents.output_schemas import ReportDefectOutput
from .agents.initializing import run_analysis
from .schemas import AnalysisSummary, AnalysisDetailDto, DefectDto
from integrations.jira.client import default_client as jira_client
from integrations.jira.schemas import FieldName


def get_default_context_input() -> ContextInput:
    return ContextInput(
        documentation=Documentation(
            product_vision="""
A flight booking application that allows users to search, book, and manage their flights easily.""",
            product_scope="""
In-scope:
- Flight search and booking
- User account management
- Payment processing
- Booking management (view, change, cancel)
- Notifications and alerts
Out-of-scope:
- Hotel and car rental bookings
- Travel insurance
- Customer support services""",
            glossary="""
- Booking: The process of reserving a flight.
- Itinerary: A detailed plan of a user's flight schedule.
- PNR (Passenger Name Record): A unique identifier for a booking.
- Fare Class: The category of service and pricing for a flight.
- Check-in: The process of confirming a flight reservation and obtaining a boarding pass.""",
            constraints="""
- The system must comply with GDPR regulations regarding user data.
- Payment processing must be PCI-DSS compliant.
- The application should support high availability and handle peak loads during holiday seasons.
- The system must integrate with multiple airline APIs for flight data.
- The user interface must be responsive and accessible on both desktop and mobile devices.""",
            sprint_goals="""
Implement user authentication and flight search functionality.""",
        ),
        guidelines="""
Should focus more on User Stories and Tasks.
Focusing on Bug items is unnecessary.
Should avoid technical implementation details.""",
        additional_context=None,
    )


class DefectService:

    @staticmethod
    def filter_work_items(db: Session, work_item_ids: List[str]) -> List[str]:
        """Returns: work item ids that have no defect assigned"""
        res = (
            db.query(DefectWorkItemId)
            .filter(~DefectWorkItemId.work_item_id.in_(work_item_ids))
            .distinct()
            .all()
        )

        return [r[0] for r in res]

    @staticmethod
    def init_analysis(db: Session, project_key: str, analysis_type: str) -> str:
        analysis = Analysis(
            id=uuid4(),
            project_key=project_key,
            type=AnalysisType(analysis_type.capitalize()),
            status=AnalysisStatus.PENDING,
            title="Pending...",
        )

        db.add(analysis)
        db.commit()

        return analysis.id

    @staticmethod
    def get_analysis_status(db: Session, analysis_id: str) -> Optional[AnalysisStatus]:
        status = db.query(Analysis.status).filter(Analysis.id == analysis_id).first()
        if status:
            return status[0]
        return None

    @staticmethod
    def get_analysis_summaries(db: Session, project_key: str) -> List[AnalysisSummary]:
        analyses = (
            db.query(Analysis)
            .filter(Analysis.project_key == project_key)
            .order_by(Analysis.started_at.desc())
            .all()
        )

        return [
            AnalysisSummary(
                id=analysis.id,
                title=analysis.title,
                status=analysis.status.value,
                type=analysis.type.value,
                started_at=analysis.started_at.isoformat(),
                ended_at=(analysis.ended_at.isoformat() if analysis.ended_at else None),
            )
            for analysis in analyses
        ]

    @staticmethod
    def get_analysis_detail(
        db: Session, analysis_id: str
    ) -> Optional[AnalysisDetailDto]:
        analysis_detail = (
            db.query(AnalysisDetail)
            .filter(AnalysisDetail.analysis_id == analysis_id)
            .first()
        )

        print("Fetched analysis detail:", analysis_detail)

        if not analysis_detail:
            return None

        defects_dto = [
            DefectDto(
                id=defect.id,
                type=defect.type.value,
                severity=defect.severity.value,
                explanation=defect.explanation,
                confidence=defect.confidence,
                suggested_fix=defect.suggested_fix,
                solved=defect.solved,
                work_item_ids=[
                    work_item.work_item_id for work_item in defect.work_item_ids
                ],
            )
            for defect in analysis_detail.defects
        ]

        return AnalysisDetailDto(
            id=analysis_detail.id,
            summary=analysis_detail.summary,
            defects=defects_dto,
        )

    @staticmethod
    def init_analysis(db: Session, project_key: str, analysis_type: str) -> str:
        print("Initializing analysis for project:", project_key, "type:", analysis_type)
        analysis = Analysis(
            id=uuid4(),
            project_key=project_key,
            type=AnalysisType(analysis_type.upper()),
            status=AnalysisStatus.PENDING,
            title="Pending...",
        )

        db.add(analysis)
        db.commit()

        return analysis.id

    @staticmethod
    def run_analysis(
        db: Session,
        analysis_id: str,
        issue_types: Optional[List[str]] = ["Story"],
    ):
        print("Running analysis with id:", analysis_id)
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise ValueError(f"Analysis with id {analysis_id} not found")

        try:
            analysis.status = AnalysisStatus.IN_PROGRESS
            analysis.title = "Running..."
            db.add(analysis)
            db.commit()

            jira_issues = jira_client.search_issues(
                jql=f"project = '{analysis.project_key}' AND issuetype in ({', '.join(issue_types)}) ORDER BY created ASC",
                fields=[
                    FieldName.SUMMARY.value,
                    FieldName.DESCRIPTION.value,
                    FieldName.ISSUE_TYPE.value,
                ],
                max_results=50,
                expand_rendered_fields=True,
            ).issues

            work_items_with_ref = [
                WorkItemWithRef(
                    id=issue.key,
                    title=issue.fields.summary,
                    description=html2text(issue.rendered_fields.description or ""),
                    type=issue.fields.issuetype.name,
                    related_work_item_ids=[],
                )
                for issue in jira_issues
            ]

            print("Running graph...")

            def _save_analysis(defects: List[DefectByLlm], report: ReportDefectOutput):
                analysis_detail = AnalysisDetail(
                    id=uuid4(),
                    analysis_id=analysis.id,
                    summary=report.content,
                    defects=[
                        Defect(
                            id=uuid4(),
                            type=DefectType(defect.type.upper()),
                            severity=DefectSeverity(defect.severity.upper()),
                            explanation=defect.explanation,
                            confidence=defect.confidence,
                            suggested_fix=defect.suggested_fix,
                            work_item_ids=[
                                DefectWorkItemId(work_item_id=wi_id)
                                for wi_id in defect.work_item_ids
                            ],
                        )
                        for defect in defects
                    ],
                )
                analysis.title = report.title
                analysis.detail = analysis_detail
                db.add(analysis)

            context_input = get_default_context_input()
            # Calculate time to run graph
            start = time.perf_counter()
            run_analysis(
                work_items_with_ref=work_items_with_ref,
                on_done=lambda defects, report: _save_analysis(defects, report),
                work_item_types=issue_types,
                context_input=context_input,
            )
            elapsed_ms = (time.perf_counter() - start) * 1000
            print("Analysis completed:", elapsed_ms, "milliseconds")
            analysis.status = AnalysisStatus.DONE
        except Exception as e:
            print("Analysis failed:", str(e))
            # print stack trace
            import traceback

            traceback.print_exc()
            analysis.status = AnalysisStatus.FAILED
        finally:
            analysis.ended_at = datetime.now()
            db.commit()
