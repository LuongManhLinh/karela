from sqlalchemy.orm import Session


from ..models import Analysis, Defect, DefectStoryKey
from app.connection.jira.models import Connection
from ..schemas import DefectDto


class DefectService:
    def __init__(self, db: Session):
        self.db = db

    def get_defects_by_ids(self, ids: list[str]) -> list[Defect]:
        return self.db.query(Defect).filter(Defect.id.in_(ids)).all()

    def get_defects_by_keys(self, keys: list[str]) -> list[Defect]:
        return self.db.query(Defect).filter(Defect.key.in_(keys)).all()

    def get_defect_keys_by_ids(self, ids: list[str]) -> list[str]:
        return [
            k[0] for k in self.db.query(Defect.key).filter(Defect.id.in_(ids)).all()
        ]

    def change_defect_solved(self, defect_id: str, solved: bool):
        defect = self.db.query(Defect).filter(Defect.id == defect_id).first()
        if not defect:
            raise ValueError(f"Defect with id {defect_id} not found")

        defect.solved = solved
        self.db.add(defect)
        self.db.commit()

    def get_defects_by_story_key(
        self, user_id: str, connection_name: str, project_key: str, story_key: str
    ) -> list[DefectDto]:
        connection_id = (
            self.db.query(Connection.id)
            .filter(Connection.user_id == user_id, Connection.name == connection_name)
            .scalar()
        )
        defects = (
            self.db.query(Defect)
            .join(DefectStoryKey, Defect.id == DefectStoryKey.defect_id)
            .join(Analysis, Defect.analysis_id == Analysis.id)
            .filter(DefectStoryKey.story_key == story_key)
            .filter(
                Analysis.connection_id == connection_id,
                Analysis.project_key == project_key,
            )
            .all()
        )

        return [
            DefectDto(
                id=defect.id,
                key=defect.key,
                type=defect.type.value,
                severity=defect.severity.value,
                explanation=defect.explanation,
                confidence=defect.confidence,
                suggested_fix=defect.suggested_fix,
                solved=defect.solved,
                story_keys=[
                    story_key_item.story_key for story_key_item in defect.story_keys
                ],
            )
            for defect in defects
        ]

    def get_defects_by_analysis_id(self, analysis_id: str) -> list[DefectDto]:
        defects = self.db.query(Defect).filter(Defect.analysis_id == analysis_id).all()

        return [
            DefectDto(
                id=defect.id,
                key=defect.key,
                type=defect.type.value,
                severity=defect.severity.value,
                explanation=defect.explanation,
                confidence=defect.confidence,
                suggested_fix=defect.suggested_fix,
                solved=defect.solved,
                story_keys=[work_item.work_item_id for work_item in defect.story_keys],
            )
            for defect in defects
        ]
