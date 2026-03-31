from sqlalchemy.orm import Session
from typing import Optional, List

from .models import Preference, GenProposalMode, GenLanguage
from .schemas import (
    PreferenceDto,
    CreatePreferenceRequest,
    UpdatePreferenceRequest,
    ProposalPreferenceDto,
    AnalysisPreferenceDto,
    ChatPreferenceDto,
)


def _preference_to_dto(pref: Preference) -> PreferenceDto:
    return PreferenceDto(
        id=pref.id,
        connection_id=pref.connection_id,
        project_key=pref.project_key,
        run_analysis_guidelines=pref.run_analysis_guidelines,
        gen_proposal_guidelines=pref.gen_proposal_guidelines,
        gen_proposal_after_analysis=pref.gen_proposal_after_analysis or False,
        gen_proposal_mode=(
            pref.gen_proposal_mode.value if pref.gen_proposal_mode else None
        ),
        gen_language=pref.gen_language.value if pref.gen_language else None,
        chat_guidelines=pref.chat_guidelines,
        updated_at=pref.updated_at,
    )


class PreferenceService:
    def __init__(self, db: Session):
        self.db = db

    def get_preference(
        self, connection_id: str, project_key: str
    ) -> Optional[PreferenceDto]:
        pref = (
            self.db.query(Preference)
            .filter(
                Preference.connection_id == connection_id,
                Preference.project_key == project_key,
            )
            .first()
        )
        if not pref:
            return None
        return _preference_to_dto(pref)

    def list_preferences_by_connection(self, connection_id: str) -> List[PreferenceDto]:
        prefs = (
            self.db.query(Preference)
            .filter(Preference.connection_id == connection_id)
            .all()
        )
        return [_preference_to_dto(p) for p in prefs]

    def create_preference(
        self, connection_id: str, project_key: str, request: CreatePreferenceRequest
    ) -> PreferenceDto:
        existing = (
            self.db.query(Preference)
            .filter(
                Preference.connection_id == connection_id,
                Preference.project_key == project_key,
            )
            .first()
        )
        if existing:
            raise ValueError(
                f"Preference already exists for connection {connection_id} and project {project_key}"
            )

        pref = Preference(
            connection_id=connection_id,
            project_key=project_key,
            run_analysis_guidelines=request.run_analysis_guidelines,
            gen_proposal_guidelines=request.gen_proposal_guidelines,
            gen_proposal_after_analysis=request.gen_proposal_after_analysis,
            gen_proposal_mode=(
                GenProposalMode(request.gen_proposal_mode)
                if request.gen_proposal_mode
                else GenProposalMode.SIMPLE
            ),
            gen_language=(
                GenLanguage(request.gen_language)
                if request.gen_language
                else GenLanguage.STORY_BASED
            ),
            chat_guidelines=request.chat_guidelines,
        )
        self.db.add(pref)
        self.db.commit()
        self.db.refresh(pref)
        return _preference_to_dto(pref)

    def update_preference(
        self,
        connection_id: str,
        project_key: str,
        request: UpdatePreferenceRequest,
    ) -> PreferenceDto:
        pref = (
            self.db.query(Preference)
            .filter(
                Preference.connection_id == connection_id,
                Preference.project_key == project_key,
            )
            .first()
        )
        if not pref:
            raise ValueError(
                f"Preference not found for connection {connection_id} and project {project_key}"
            )

        if request.run_analysis_guidelines is not None:
            pref.run_analysis_guidelines = request.run_analysis_guidelines
        if request.gen_proposal_guidelines is not None:
            pref.gen_proposal_guidelines = request.gen_proposal_guidelines
        if request.gen_proposal_after_analysis is not None:
            pref.gen_proposal_after_analysis = request.gen_proposal_after_analysis
        if request.gen_proposal_mode is not None:
            pref.gen_proposal_mode = GenProposalMode(request.gen_proposal_mode)
        if request.gen_language is not None:
            pref.gen_language = GenLanguage(request.gen_language)
        if request.chat_guidelines is not None:
            pref.chat_guidelines = request.chat_guidelines

        self.db.add(pref)
        self.db.commit()
        self.db.refresh(pref)
        return _preference_to_dto(pref)

    def delete_preference(self, connection_id: str, project_key: str) -> None:
        pref = (
            self.db.query(Preference)
            .filter(
                Preference.connection_id == connection_id,
                Preference.project_key == project_key,
            )
            .first()
        )
        if not pref:
            raise ValueError(
                f"Preference not found for connection {connection_id} and project {project_key}"
            )
        self.db.delete(pref)
        self.db.commit()

    def get_proposal_preference(
        self, connection_id: str, project_key: str
    ) -> Optional[ProposalPreferenceDto]:
        pref = (
            self.db.query(Preference)
            .filter(
                Preference.connection_id == connection_id,
                Preference.project_key == project_key,
            )
            .first()
        )
        if not pref:
            return None
        return ProposalPreferenceDto(
            gen_proposal_mode=(
                pref.gen_proposal_mode.value if pref.gen_proposal_mode else None
            ),
            gen_language=pref.gen_language.value if pref.gen_language else None,
            gen_proposal_guidelines=pref.gen_proposal_guidelines,
        )

    def get_analysis_preference(
        self, connection_id: str, project_key: str
    ) -> Optional[AnalysisPreferenceDto]:
        pref = (
            self.db.query(Preference)
            .filter(
                Preference.connection_id == connection_id,
                Preference.project_key == project_key,
            )
            .first()
        )
        if not pref:
            return None
        return AnalysisPreferenceDto(
            run_analysis_guidelines=pref.run_analysis_guidelines,
            gen_proposal_after_analysis=pref.gen_proposal_after_analysis or False,
            gen_language=pref.gen_language.value if pref.gen_language else None,
        )

    def get_chat_preference(
        self, connection_id: str, project_key: str
    ) -> Optional[ChatPreferenceDto]:
        pref = (
            self.db.query(Preference)
            .filter(
                Preference.connection_id == connection_id,
                Preference.project_key == project_key,
            )
            .first()
        )
        if not pref:
            return None
        return ChatPreferenceDto(chat_guidelines=pref.chat_guidelines)
