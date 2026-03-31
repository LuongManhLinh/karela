from app.analysis.models import (
    Analysis,
    AnalysisStatus,
    AnalysisType,
    Defect,
)
from app.proposal.models import Proposal
from app.analysis.schemas import (
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

    def _get_analysis_summaries(self, *filters) -> List[AnalysisSummary]:
        defect_counts = (
            self.db.query(
                Defect.analysis_id.label("analysis_id"),
                func.count(Defect.id).label("num_defects"),
            )
            .group_by(Defect.analysis_id)
            .subquery()
        )

        proposal_counts = (
            self.db.query(
                Proposal.analysis_session_id.label("analysis_id"),
                func.count(Proposal.id).label("num_proposals"),
            )
            .filter(Proposal.analysis_session_id.isnot(None))
            .group_by(Proposal.analysis_session_id)
            .subquery()
        )

        analyses = (
            self.db.query(
                Analysis,
                func.coalesce(defect_counts.c.num_defects, 0).label("num_defects"),
                func.coalesce(proposal_counts.c.num_proposals, 0).label(
                    "num_proposals"
                ),
            )
            .outerjoin(defect_counts, defect_counts.c.analysis_id == Analysis.id)
            .outerjoin(proposal_counts, proposal_counts.c.analysis_id == Analysis.id)
            .filter(*filters)
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
                generating_proposals=analysis.generating_proposals,
                num_defects=num_defects,
                num_proposals=num_proposals,
            )
            for analysis, num_defects, num_proposals in analyses
        ]

    def init_analysis(
        self,
        connection_id: str,
        project_key: str,
        analysis_type: Literal["TARGETED", "ALL"],
        story_key: Optional[str] = None,
    ):
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

    def set_generating_proposals(self, analysis_id: str, is_generating: bool):
        analysis = self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if analysis:
            analysis.generating_proposals = is_generating
            self.db.commit()

    def get_analysis_summaries_by_connection(
        self, connection_id: str
    ) -> List[AnalysisSummary]:
        return self._get_analysis_summaries(Analysis.connection_id == connection_id)

    def get_analysis_summaries_by_project(
        self, connection_id: str, project_key: str
    ) -> List[AnalysisSummary]:
        return self._get_analysis_summaries(
            Analysis.connection_id == connection_id,
            Analysis.project_key == project_key,
        )

    def get_analysis_summaries_by_story(
        self, connection_id: str, project_key: str, story_key: str
    ) -> List[AnalysisSummary]:
        return self._get_analysis_summaries(
            Analysis.connection_id == connection_id,
            Analysis.project_key == project_key,
            Analysis.story_key == story_key,
        )

    def get_analysis_details(
        self,
        connection_id: str,
        analysis_id_or_key: str,
    ) -> Optional[AnalysisDto]:
        analysis = (
            self.db.query(Analysis)
            .join(Connection, Connection.id == Analysis.connection_id)
            .filter(
                Connection.id == connection_id,
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
            generating_proposals=analysis.generating_proposals,
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
                    story_keys=[work_item.story_key for work_item in defect.story_keys],
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
