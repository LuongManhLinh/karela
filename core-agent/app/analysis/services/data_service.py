from app.analysis.models import (
    Analysis,
    AnalysisStatus,
    AnalysisType,
    Defect,
    DefectWorkItemId,
)
from app.analysis.schemas import (
    AnalysisDetailDto,
    AnalysisDto,
    AnalysisSummary,
    DefectDto,
)


from sqlalchemy.orm import Session


from datetime import datetime
from typing import List, Optional, Literal


class DefectDataService:
    def __init__(self, db: Session):
        self.db = db

    def init_analysis(
        self,
        connection_id: str,
        project_key: str,
        analysis_type: Literal["TARGETED", "ALL"],
        story_key: Optional[str] = None,
    ) -> str:
        analysis_type = AnalysisType(analysis_type)
        print("Initializing analysis of type:", analysis_type)
        analysis = Analysis(
            project_key=project_key,
            type=analysis_type,
            status=AnalysisStatus.PENDING,
            connection_id=connection_id,
            started_at=datetime.now(),
            story_key=story_key,
        )

        self.db.add(analysis)
        self.db.commit()

        return analysis.id

    def get_analysis_status(self, analysis_id: str) -> Optional[str]:
        status = (
            self.db.query(Analysis.status).filter(Analysis.id == analysis_id).first()
        )
        if status:
            return status[0].value
        return None

    def get_analysis_summaries(self, connection_id: str) -> List[AnalysisSummary]:
        analyses = (
            self.db.query(Analysis)
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

    def get_analysis_details(self, analysis_id: str) -> Optional[AnalysisDetailDto]:
        analysis_detail = (
            self.db.query(Analysis).filter(Analysis.id == analysis_id).first()
        )

        print("Fetched analysis detail:", analysis_detail)

        if not analysis_detail:
            return None

        # Query order by solved, type asc, severity desc
        defects = (
            self.db.query(Defect)
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

    def change_defect_solved(self, defect_id: str, solved: bool):
        defect = self.db.query(Defect).filter(Defect.id == defect_id).first()
        if not defect:
            raise ValueError(f"Defect with id {defect_id} not found")

        defect.solved = solved
        self.db.add(defect)
        self.db.commit()

    def get_defects_by_work_item_key(self, key: str) -> List[DefectDto]:
        defects = (
            self.db.query(Defect)
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

    def get_latest_done_analysis(
        self, project_key: str, story_key: Optional[str] = None
    ) -> Optional[Analysis]:
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
