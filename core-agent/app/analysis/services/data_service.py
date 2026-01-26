from app.analysis.models import (
    Analysis,
    AnalysisStatus,
    AnalysisType,
    Defect,
)
from app.analysis.schemas import (
    AnalysisDto,
    AnalysisDto,
    AnalysisSummary,
    DefectDto,
)
from app.connection.jira.models import Connection
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session


from datetime import datetime
from typing import List, Optional, Literal


class AnalysisDataService:
    def __init__(self, db: Session):
        self.db = db

    def init_analysis(
        self,
        connection_id: str,
        project_key: str,
        analysis_type: Literal["TARGETED", "ALL"],
        story_key: Optional[str] = None,
    ) -> str:
        stmt = select(func.count(Analysis.id)).filter(
            Analysis.connection_id == connection_id,
            Analysis.project_key == project_key,
        )
        analysis_count = self.db.execute(stmt).scalar_one()
        analysis_type = AnalysisType(analysis_type)
        analysis = Analysis(
            key=f"{project_key}-ANA-{analysis_count + 1}",
            project_key=project_key,
            type=analysis_type,
            status=AnalysisStatus.PENDING,
            connection_id=connection_id,
            created_at=datetime.now(),
            story_key=story_key,
        )

        self.db.add(analysis)
        self.db.commit()

        return analysis.id, analysis.key

    def get_raw_analysis_by_id(self, analysis_id: str) -> Optional[Analysis]:
        analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
        return analysis

    def get_analysis_status(self, analysis_id: str) -> Optional[str]:
        status = (
            self.db.query(Analysis.status).filter(Analysis.id == analysis_id).first()
        )
        if status:
            return status[0].value
        return None

    def get_analysis_summaries_by_project(
        self, user_id: str, connection_name: str, project_key: str
    ) -> List[AnalysisSummary]:
        analyses = (
            self.db.query(Analysis)
            .join(Connection, Connection.id == Analysis.connection_id)
            .filter(
                Connection.user_id == user_id,
                Connection.name == connection_name,
                Analysis.project_key == project_key,
            )
            .order_by(Analysis.created_at.desc())
            .all()
        )

        return [
            AnalysisSummary(
                id=analysis.id,
                key=analysis.key,
                project_key=analysis.project_key,
                story_key=analysis.story_key,
                status=analysis.status.value,
                type=analysis.type.value,
                created_at=analysis.created_at.isoformat(),
                ended_at=(analysis.ended_at.isoformat() if analysis.ended_at else None),
            )
            for analysis in analyses
        ]

    def get_analysis_summaries_by_story(
        self, user_id: str, connection_name: str, project_key: str, story_key: str
    ) -> List[AnalysisSummary]:
        analyses = (
            self.db.query(Analysis)
            .join(Analysis.connection)
            .filter(
                Connection.user_id == user_id,
                Connection.name == connection_name,
                Analysis.project_key == project_key,
                Analysis.story_key == story_key,
            )
            .order_by(Analysis.created_at.desc())
            .all()
        )

        return [
            AnalysisSummary(
                id=analysis.id,
                key=analysis.key,
                project_key=analysis.project_key,
                story_key=analysis.story_key,
                status=analysis.status.value,
                type=analysis.type.value,
                created_at=analysis.created_at.isoformat(),
                ended_at=(analysis.ended_at.isoformat() if analysis.ended_at else None),
            )
            for analysis in analyses
        ]

    def get_analysis_details(
        self,
        user_id: str,
        connection_name: str,
        project_key: str,
        analysis_id_or_key: str,
    ) -> Optional[AnalysisDto]:
        analysis = (
            self.db.query(Analysis)
            .join(Analysis.connection)
            .filter(
                Connection.user_id == user_id,
                Connection.name == connection_name,
                Analysis.project_key == project_key,
                or_(
                    Analysis.id == analysis_id_or_key,
                    Analysis.key == analysis_id_or_key,
                ),
            )
            .first()
        )

        if not analysis:
            raise ValueError("Analysis not found")

        # Query order by solved, type asc, severity desc
        defects = (
            self.db.query(Defect)
            .filter(Defect.analysis_id == analysis.id)
            .order_by(Defect.solved.asc(), Defect.type.asc(), Defect.severity.desc())
            .all()
        )

        return AnalysisDto(
            id=analysis.id,
            key=analysis.key,
            project_key=analysis.project_key,
            story_key=analysis.story_key,
            status=analysis.status.value,
            type=analysis.type.value,
            created_at=analysis.created_at.isoformat(),
            ended_at=(analysis.ended_at.isoformat() if analysis.ended_at else None),
            defects=[
                DefectDto(
                    id=defect.id,
                    key=defect.key,
                    type=defect.type.value,
                    severity=defect.severity.value,
                    explanation=defect.explanation,
                    confidence=defect.confidence,
                    suggested_fix=defect.suggested_fix,
                    solved=defect.solved,
                    story_keys=[work_item.key for work_item in defect.story_keys],
                )
                for defect in defects
            ],
        )

    def get_latest_done_analysis(
        self, project_key: str, story_key: Optional[str] = None
    ):
        analysis = (
            self.db.query(Analysis)
            .filter(
                Analysis.project_key == project_key,
                Analysis.status == AnalysisStatus.DONE,
                Analysis.story_key == story_key if story_key else True,
            )
            .order_by(Analysis.ended_at.desc())
            .first()
        )
        if not analysis:
            return None
        return AnalysisDto(
            id=analysis.id,
            key=analysis.key,
            status=analysis.status.value,
            type=analysis.type.value,
            created_at=analysis.created_at.isoformat(),
            ended_at=(analysis.ended_at.isoformat() if analysis.ended_at else None),
            story_key=analysis.story_key,
            defects=[
                DefectDto(
                    id=defect.id,
                    key=defect.key,
                    type=defect.type.value,
                    severity=defect.severity.value,
                    explanation=defect.explanation,
                    confidence=defect.confidence,
                    suggested_fix=defect.suggested_fix,
                    solved=defect.solved,
                    story_keys=[work_item.key for work_item in defect.story_keys],
                )
                for defect in analysis.defects
            ],
        )

    def get_analyses_statuses(self, analysis_ids: List[str]) -> List[dict]:
        analyses = (
            self.db.query(Analysis.id, Analysis.status)
            .filter(Analysis.id.in_(analysis_ids))
            .all()
        )

        return {analysis.id: analysis.status.value for analysis in analyses}
