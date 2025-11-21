from .agents.general_schemas import DefectByLlm, WorkItemMinimal
from .agents.input_schemas import ContextInput, Documentation, LlmContext
from .agents.story.all import (
    run_analysis as run_user_stories_analysis_all,
    run_analysis_async as run_user_stories_analysis_all_async,
)
from .agents.story.target import (
    run_analysis as run_user_stories_analysis_target,
    run_analysis_async as run_user_stories_analysis_target_async,
)
from .models import (
    Analysis,
    AnalysisStatus,
    AnalysisType,
    Defect,
    DefectSeverity,
    DefectType,
    DefectWorkItemId,
)
from .schemas import AnalysisDetailDto, AnalysisDto, AnalysisSummary, DefectDto
from features.settings.models import Settings


from html2text import html2text
from sqlalchemy.orm import Session


import time
import traceback
from datetime import datetime
from typing import List, Optional
from features.integrations import get_platform_service


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


class DefectRunService:
    # ---------------------------
    # Shared Utilities
    # ---------------------------

    @staticmethod
    def _get_analysis_or_raise(db: Session, analysis_id: str) -> Analysis:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise ValueError(f"Analysis with id {analysis_id} not found")
        return analysis

    @staticmethod
    def _start_analysis(
        db: Session, analysis: Analysis, status=AnalysisStatus.IN_PROGRESS
    ):
        analysis.status = status
        db.add(analysis)
        db.commit()

    @staticmethod
    def _finish_analysis(db: Session, analysis: Analysis, status: AnalysisStatus):
        analysis.status = status
        analysis.ended_at = datetime.now()
        db.commit()

    @staticmethod
    def _save_defects_to_analysis(analysis: Analysis, defects: List[DefectByLlm]):
        analysis.defects = [
            Defect(
                type=DefectType(defect.type.upper()),
                severity=DefectSeverity(defect.severity.upper()),
                explanation=defect.explanation,
                confidence=defect.confidence,
                suggested_fix=defect.suggested_fix,
                work_item_ids=[
                    DefectWorkItemId(key=key) for key in defect.work_item_keys
                ],
            )
            for defect in defects
        ]

    @staticmethod
    def _fetch_issues(
        db: Session, project_key: str, issue_types: List[str], connection_id: str
    ):
        return get_platform_service(db, connection_id=connection_id).search_issues(
            db=db,
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

    @staticmethod
    def analyze_all_user_stories(db: Session, analysis_id: str):
        analysis = DefectRunService._get_analysis_or_raise(db, analysis_id)
        try:
            DefectRunService._start_analysis(db, analysis)

            issues = DefectRunService._fetch_issues(
                db, analysis.project_key, ["Story"], analysis.connection_id
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
                db=db,
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
                for d in db.query(Defect)
                .join(Analysis)
                .filter(
                    Defect.solved == False, Analysis.project_key == analysis.project_key
                )
            ]

            start = time.perf_counter()
            run_user_stories_analysis_all(
                user_stories=user_stories,
                on_done=lambda defects: DefectRunService._save_defects_to_analysis(
                    analysis, defects
                ),
                context_input=context_input,
                existing_defects=existing_defects,
            )
            print(
                "User stories analysis completed in:",
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            DefectRunService._finish_analysis(db, analysis, AnalysisStatus.DONE)
        except Exception:
            traceback.print_exc()
            DefectRunService._finish_analysis(db, analysis, AnalysisStatus.FAILED)

    @staticmethod
    async def analyze_all_user_stories_async(db: Session, analysis_id: str):
        analysis = DefectRunService._get_analysis_or_raise(db, analysis_id)
        try:
            DefectRunService._start_analysis(db, analysis)

            issues = DefectRunService._fetch_issues(
                db, analysis.project_key, ["Story"], analysis.connection_id
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
                for d in db.query(Defect)
                .join(Analysis)
                .filter(
                    Defect.solved == False, Analysis.project_key == analysis.project_key
                )
            ]

            start = time.perf_counter()
            await run_user_stories_analysis_all_async(
                user_stories=user_stories,
                on_done=lambda defects: DefectRunService._save_defects_to_analysis(
                    analysis, defects
                ),
                context_input=context_input,
                existing_defects=existing_defects,
            )
            print(
                "User stories analysis (async) completed in:",
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            DefectRunService._finish_analysis(db, analysis, AnalysisStatus.DONE)
        except Exception:
            traceback.print_exc()
            DefectRunService._finish_analysis(db, analysis, AnalysisStatus.FAILED)

    # ---------------------------
    # ANALYZE TARGET STORY (sync + async)
    # ---------------------------

    @staticmethod
    def analyze_target_user_story(db: Session, analysis_id: str, target_key: str):
        analysis = DefectRunService._get_analysis_or_raise(db, analysis_id)
        try:
            DefectRunService._start_analysis(db, analysis)

            issues = DefectRunService._fetch_issues(
                db, analysis.project_key, ["Story"], analysis.connection_id
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
                db=db,
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
                for d in db.query(Defect)
                .join(DefectWorkItemId)
                .filter(DefectWorkItemId.key == target_key, Defect.solved == False)
                .distinct()
            ]

            start = time.perf_counter()
            run_user_stories_analysis_target(
                target_user_story=target,
                user_stories=user_stories,
                on_done=lambda defects: DefectRunService._save_defects_to_analysis(
                    analysis, defects
                ),
                context_input=context_input,
                existing_defects=existing_defects,
            )
            print(
                "Target story analysis completed in:",
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            DefectRunService._finish_analysis(db, analysis, AnalysisStatus.DONE)
        except Exception:
            traceback.print_exc()
            DefectRunService._finish_analysis(db, analysis, AnalysisStatus.FAILED)

    @staticmethod
    async def analyze_target_user_story_async(
        db: Session, analysis_id: str, target_key: str
    ):
        analysis = DefectRunService._get_analysis_or_raise(db, analysis_id)
        try:
            DefectRunService._start_analysis(db, analysis)

            issues = DefectRunService._fetch_issues(
                db, analysis.project_key, ["Story"], analysis.connection_id
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
                for d in db.query(Defect)
                .join(DefectWorkItemId)
                .filter(DefectWorkItemId.key == target_key, Defect.solved == False)
                .distinct()
            ]

            start = time.perf_counter()
            await run_user_stories_analysis_target_async(
                user_stories=user_stories,
                target_user_story_key=target_key,
                on_done=lambda defects: DefectRunService._save_defects_to_analysis(
                    analysis, defects
                ),
                context_input=context_input,
                existing_defects=existing_defects,
            )
            print(
                "Target story analysis (async) completed in:",
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            DefectRunService._finish_analysis(db, analysis, AnalysisStatus.DONE)
        except Exception:
            traceback.print_exc()
            DefectRunService._finish_analysis(db, analysis, AnalysisStatus.FAILED)


class DefectDataService:
    @staticmethod
    def init_analysis(
        db: Session, connection_id: str, project_key: str, analysis_type: str
    ) -> str:
        analysis = Analysis(
            project_key=project_key,
            type=AnalysisType(analysis_type.capitalize()),
            status=AnalysisStatus.PENDING,
            connection_id=connection_id,
            created_at=datetime.now(),
        )

        db.add(analysis)
        db.commit()

        return analysis.id

    @staticmethod
    def get_analysis_status(db: Session, analysis_id: str) -> Optional[str]:
        status = db.query(Analysis.status).filter(Analysis.id == analysis_id).first()
        if status:
            return status[0].value
        return None

    @staticmethod
    def get_analysis_summaries(
        db: Session, connection_id: str
    ) -> List[AnalysisSummary]:
        analyses = (
            db.query(Analysis)
            .filter(
                Analysis.connection_id == connection_id,
            )
            .order_by(Analysis.started_at.desc())
            .all()
        )

        return [
            AnalysisSummary(
                id=analysis.id,
                project_key=analysis.project_key,
                story_key=analysis.story_key,
                status=analysis.status.value,
                type=analysis.type.value,
                started_at=analysis.started_at.isoformat(),
                ended_at=(analysis.ended_at.isoformat() if analysis.ended_at else None),
            )
            for analysis in analyses
        ]

    @staticmethod
    def get_analysis_details(
        db: Session, analysis_id: str
    ) -> Optional[AnalysisDetailDto]:
        analysis_detail = db.query(Analysis).filter(Analysis.id == analysis_id).first()

        print("Fetched analysis detail:", analysis_detail)

        if not analysis_detail:
            return None

        # Query order by solved, type asc, severity desc
        defects = (
            db.query(Defect)
            .filter(Defect.analysis_id == analysis_detail.id)
            .order_by(Defect.solved.asc(), Defect.type.asc(), Defect.severity.desc())
            .all()
        )

        defects_dto = [
            DefectDto(
                id=defect.id,
                type=defect.type.value,
                severity=defect.severity.value,
                explanation=defect.explanation,
                confidence=defect.confidence,
                suggested_fix=defect.suggested_fix,
                solved=defect.solved,
                work_item_keys=[work_item.key for work_item in defect.work_item_ids],
            )
            for defect in defects
        ]

        return AnalysisDetailDto(
            id=analysis_detail.id,
            project_key=analysis_detail.project_key,
            story_key=analysis_detail.story_key,
            status=analysis_detail.status.value,
            type=analysis_detail.type.value,
            started_at=analysis_detail.started_at.isoformat(),
            ended_at=(
                analysis_detail.ended_at.isoformat()
                if analysis_detail.ended_at
                else None
            ),
            defects=defects_dto,
        )

    @staticmethod
    def change_defect_solved(db: Session, defect_id: str, solved: bool):
        defect = db.query(Defect).filter(Defect.id == defect_id).first()
        if not defect:
            raise ValueError(f"Defect with id {defect_id} not found")

        defect.solved = solved
        db.add(defect)
        db.commit()

    @staticmethod
    def get_defects_by_work_item_key(db: Session, key: str) -> List[DefectDto]:
        defects = (
            db.query(Defect)
            .join(DefectWorkItemId)
            .filter(DefectWorkItemId.work_item_id == key)
            .all()
        )

        return [
            DefectDto(
                id=defect.id,
                type=defect.type.value,
                severity=defect.severity.value,
                explanation=defect.explanation,
                confidence=defect.confidence,
                suggested_fix=defect.suggested_fix,
                solved=defect.solved,
                work_item_keys=[
                    work_item.work_item_id for work_item in defect.work_item_ids
                ],
            )
            for defect in defects
        ]

    @staticmethod
    def get_latest_done_analysis(
        db: Session, project_key: str, story_key: Optional[str] = None
    ) -> Optional[Analysis]:
        analysis = (
            db.query(Analysis)
            .filter(
                Analysis.project_key == project_key,
                Analysis.status == AnalysisStatus.DONE,
                Analysis.story_key == story_key if story_key else True,
            )
            .order_by(Analysis.ended_at.desc())
            .first()
        )
        return AnalysisDto(
            id=analysis.id,
            status=analysis.status.value,
            type=analysis.type.value,
            started_at=analysis.started_at.isoformat(),
            ended_at=(analysis.ended_at.isoformat() if analysis.ended_at else None),
            story_key=analysis.story_key,
            error_message=analysis.error_message,
            defects=[
                DefectDto(
                    id=defect.id,
                    type=defect.type.value,
                    severity=defect.severity.value,
                    explanation=defect.explanation,
                    confidence=defect.confidence,
                    suggested_fix=defect.suggested_fix,
                    solved=defect.solved,
                    work_item_keys=[
                        work_item.work_item_id for work_item in defect.work_item_ids
                    ],
                )
                for defect in analysis.defects
            ],
        )
