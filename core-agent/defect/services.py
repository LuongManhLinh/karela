from sqlalchemy import and_, func
from sqlalchemy.orm import Session
from typing import List, Optional
import time
from datetime import datetime
from html2text import html2text
import traceback

from .models import (
    DefectWorkItemId,
    Defect,
    DefectType,
    DefectSeverity,
    Analysis,
    AnalysisType,
    AnalysisStatus,
    ChatSession,
    Message,
    SenderRole,
    WorkItemVersion,
)
from .analyzer_agents.general_schemas import (
    WorkItemWithRef,
    DefectByLlm,
    WorkItemMinimal,
)
from .analyzer_agents.input_schemas import ContextInput, Documentation
from .analyzer_agents.output_schemas import ReportDefectOutput
from .analyzer_agents.initializing import run_analysis, run_analysis_async
from .analyzer_agents.story.all import (
    run_analysis as run_user_stories_analysis_all,
    run_analysis_async as run_user_stories_analysis_all_async,
)
from .analyzer_agents.story.target import (
    run_analysis as run_user_stories_analysis_target,
    run_analysis_async as run_user_stories_analysis_target_async,
)
from .schemas import AnalysisSummary, AnalysisDetailDto, DefectDto
from integrations.jira.client import default_client as jira_client
from integrations.jira.schemas import FieldName, IssuesCreateRequest
from integrations.jira.defaults import DEFAULT_SETTINGS_KEY
from utils.markdown_adf_bridge import adf_to_md, md_to_adf


def get_default_context_input(project_key: str) -> ContextInput:
    try:
        jira_settings = jira_client.get_settings(project_key, DEFAULT_SETTINGS_KEY)
        return ContextInput(
            documentation=Documentation(
                product_vision=jira_settings.get("product_vision"),
                product_scope=jira_settings.get("product_scope"),
                sprint_goals=jira_settings.get("sprint_goals"),
                glossary=jira_settings.get("glossary"),
                constraints=jira_settings.get("constraints"),
                additional_docs=jira_settings.get("additional_docs"),
            ),
            guidelines=jira_settings.get("guidelines"),
        )
    except Exception as e:
        print("Failed to fetch Jira settings:", str(e))
        return None


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
    def _fetch_jira_issues(project_key: str, issue_types: List[str]):
        return jira_client.search_issues(
            jql=f"project = '{project_key}' AND issuetype in ({', '.join(issue_types)}) ORDER BY created ASC",
            fields=[
                FieldName.SUMMARY.value,
                FieldName.DESCRIPTION.value,
                FieldName.ISSUE_TYPE.value,
            ],
            max_results=50,
            expand_rendered_fields=True,
        ).issues

    # ---------------------------
    # ANALYZE ALL
    # ---------------------------

    @staticmethod
    def analyze_all(
        db: Session, analysis_id: str, issue_types: Optional[List[str]] = ["Story"]
    ):
        analysis = DefectRunService._get_analysis_or_raise(db, analysis_id)
        try:
            DefectRunService._start_analysis(db, analysis)

            issues = DefectRunService._fetch_jira_issues(
                analysis.project_key, issue_types
            )
            work_items = [
                WorkItemWithRef(
                    key=i.key,
                    title=i.fields.summary,
                    description=html2text(i.rendered_fields.description or ""),
                    type=i.fields.issuetype.name,
                    related_work_item_ids=[],
                )
                for i in issues
            ]

            context_input = get_default_context_input(analysis.project_key)

            start = time.perf_counter()
            run_analysis(
                work_items_with_ref=work_items,
                on_done=lambda defects, report: DefectRunService._save_defects_to_analysis(
                    analysis, defects
                ),
                work_item_types=issue_types,
                context_input=context_input,
            )
            print("Analysis completed in:", (time.perf_counter() - start) * 1000, "ms")

            DefectRunService._finish_analysis(db, analysis, AnalysisStatus.DONE)
        except Exception:
            traceback.print_exc()
            DefectRunService._finish_analysis(db, analysis, AnalysisStatus.FAILED)

    @staticmethod
    async def analyze_all_async(
        db: Session, analysis_id: str, issue_types: Optional[List[str]] = ["Story"]
    ):
        analysis = DefectRunService._get_analysis_or_raise(db, analysis_id)
        try:
            DefectRunService._start_analysis(db, analysis)

            issues = DefectRunService._fetch_jira_issues(
                analysis.project_key, issue_types
            )
            work_items = [
                WorkItemWithRef(
                    key=i.key,
                    title=i.fields.summary,
                    description=html2text(i.rendered_fields.description or ""),
                    type=i.fields.issuetype.name,
                    related_work_item_ids=[],
                )
                for i in issues
            ]

            context_input = get_default_context_input(analysis.project_key)

            start = time.perf_counter()
            await run_analysis_async(
                work_items_with_ref=work_items,
                on_done=lambda defects, report: DefectRunService._save_defects_to_analysis(
                    analysis, defects
                ),
                work_item_types=issue_types,
                context_input=context_input,
            )
            print(
                "Analysis (async) completed in:",
                (time.perf_counter() - start) * 1000,
                "ms",
            )

            DefectRunService._finish_analysis(db, analysis, AnalysisStatus.DONE)
        except Exception:
            traceback.print_exc()
            DefectRunService._finish_analysis(db, analysis, AnalysisStatus.FAILED)

    # ---------------------------
    # ANALYZE ALL USER STORIES
    # ---------------------------

    @staticmethod
    def analyze_all_user_stories(db: Session, analysis_id: str):
        analysis = DefectRunService._get_analysis_or_raise(db, analysis_id)
        try:
            DefectRunService._start_analysis(db, analysis)

            issues = DefectRunService._fetch_jira_issues(
                analysis.project_key, ["Story"]
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

            issues = DefectRunService._fetch_jira_issues(
                analysis.project_key, ["Story"]
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

            issues = DefectRunService._fetch_jira_issues(
                analysis.project_key, ["Story"]
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
            run_user_stories_analysis_target(
                user_stories=user_stories,
                target_user_story_key=target_key,
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

            issues = DefectRunService._fetch_jira_issues(
                analysis.project_key, ["Story"]
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
    def init_analysis(db: Session, project_key: str, analysis_type: str) -> str:
        analysis = Analysis(
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
        analysis_detail = db.query(Analysis).filter(Analysis.id == analysis_id).first()

        print("Fetched analysis detail:", analysis_detail)

        if not analysis_detail:
            return None

        # Query order by solved, type asc, severity desc
        defects = (
            db.query(Defect)
            .filter(Defect.analysis_detail_id == analysis_detail.id)
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
                work_item_keys=[
                    work_item.work_item_id for work_item in defect.work_item_ids
                ],
            )
            for defect in defects
        ]

        return AnalysisDetailDto(
            id=analysis_detail.id,
            defects=defects_dto,
        )

    @staticmethod
    def init_analysis(db: Session, project_key: str, analysis_type: str) -> str:
        print("Initializing analysis for project:", project_key, "type:", analysis_type)
        analysis = Analysis(
            project_key=project_key,
            type=AnalysisType(analysis_type.upper()),
            status=AnalysisStatus.PENDING,
            title="Pending...",
        )

        db.add(analysis)
        db.commit()

        return analysis.id

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
    def modify_multiple_stories(
        db: Session, project_key: str, modifications: list[dict]
    ):
        keys = []
        valid_modifications = {}
        for mod in modifications:
            key = mod.get("key")
            if not key:
                continue
            keys.append(key)
            valid_modifications[key] = mod

        issues = jira_client.search_issues(
            jql=f'project="{project_key}" AND key IN ({",".join(keys)}) AND issuetype="Story"',
            fields=["Summary", "Description"],
            max_results=len(keys),
            expand_rendered_fields=False,
        ).issues

        sub = (
            db.query(
                WorkItemVersion.key,
                func.max(WorkItemVersion.version).label("latest_version"),
            )
            .filter(WorkItemVersion.key.in_(keys))
            .group_by(WorkItemVersion.key)
            .subquery()
        )

        rows = (
            db.query(WorkItemVersion)
            .join(
                sub,
                (WorkItemVersion.key == sub.c.key)
                & (WorkItemVersion.version == sub.c.latest_version),
            )
            .all()
        )

        version_lookup = {v.key: v for v in rows}

        for issue in issues:
            # Save a version before modifying
            existing_version = version_lookup.get(issue.key)
            if existing_version:
                existing_version.version += 1
            else:
                existing_version = WorkItemVersion(
                    key=issue.key,
                    summary=issue.fields.summary,
                    description=adf_to_md(issue.fields.description),
                )
            db.add(existing_version)

            mod = valid_modifications.get(issue.key)
            update_fields = {"issue_id": issue.id, "summary": mod.get("summary")}
            updated_description = mod.get("description")
            if updated_description:
                update_fields["description"] = md_to_adf(updated_description)

            jira_client.modify_issue(**update_fields)
        return len(keys)

    @staticmethod
    def create_stories(project_key: str, stories: list[dict]) -> List[str]:
        created_keys = jira_client.create_issues(
            issues=IssuesCreateRequest(
                **{
                    "issueUpdates": [
                        {
                            "fields": {
                                "project": {"key": project_key},
                                "summary": story["summary"],
                                "description": md_to_adf(story["description"]),
                                "issuetype": {"name": "Story"},
                            }
                        }
                        for story in stories
                    ]
                }
            )
        )
        return created_keys


class DefectChatService:
    @staticmethod
    def create_chat_session(
        db: Session, inital_message: str, role: str, work_item_id: str = None
    ) -> str:
        chat_session = ChatSession(work_item_id=work_item_id)
        message = Message(
            session_id=chat_session.id, role=SenderRole(role), content=inital_message
        )
        chat_session.messages = [message]

        db.add(chat_session)
        db.commit()

        return chat_session.id
