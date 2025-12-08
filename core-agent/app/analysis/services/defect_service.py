from sqlalchemy.orm import Session
from typing import List, Optional


from ..models import Defect, DefectStoryKey
from ..schemas import DefectDto


class DefectService:
    def __init__(self, db: Session):
        self.db = db

    def get_defects_by_ids(self, ids: list[str]) -> list[Defect]:
        return self.db.query(Defect).filter(Defect.id.in_(ids)).all()

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

    def get_defects_by_story_key(self, key: str) -> List[DefectDto]:
        defects = (
            self.db.query(Defect)
            .join(DefectStoryKey)
            .filter(DefectStoryKey.key == key)
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
                story_keys=[work_item.work_item_id for work_item in defect.story_keys],
            )
            for defect in defects
        ]

    def get_defects_by_analysis_id(self, analysis_id: str) -> List[DefectDto]:
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
