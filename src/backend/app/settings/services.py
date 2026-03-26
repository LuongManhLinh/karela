from sqlalchemy.orm import Session
from typing import Optional, List, Any

from fastapi import UploadFile

from common.agents.input_schemas import ContextInput
from common.agents.input_schemas import Documentation as DocumentationInput
from common.agents.input_schemas import LlmContext
from utils.file_storage import upload_file, download_file, delete_file
from .models import Documentation, Preference, GenProposalMode, GenLanguage
from .schemas import (
    SettingsDto,
    CreateSettingsRequest,
    UpdateSettingsRequest,
    AdditionalDocDto,
    AdditionalFileDto,
    PreferenceDto,
    CreatePreferenceRequest,
    UpdatePreferenceRequest,
)


def _normalize_additional_docs(raw_docs: Any) -> Optional[List[dict]]:
    if not raw_docs:
        return None

    if isinstance(raw_docs, list):
        normalized_docs = []
        for doc in raw_docs:
            if not isinstance(doc, dict):
                continue
            normalized_docs.append(
                {
                    "title": doc.get("title") or "",
                    "content": doc.get("content") or "",
                    "description": doc.get("description"),
                }
            )
        return normalized_docs or None

    if isinstance(raw_docs, dict):
        # Backward compatibility with the old dict shape.
        if "title" in raw_docs or "content" in raw_docs:
            return [
                {
                    "title": raw_docs.get("title") or "",
                    "content": raw_docs.get("content") or "",
                    "description": raw_docs.get("description"),
                }
            ]
        return [
            {
                "title": str(title),
                "content": str(content) if content is not None else "",
                "description": None,
            }
            for title, content in raw_docs.items()
        ]

    return None


def _normalize_additional_files(raw_files: Any) -> Optional[List[dict]]:
    if not raw_files or not isinstance(raw_files, list):
        return None

    normalized_files = []
    for file in raw_files:
        if not isinstance(file, dict):
            continue
        filename = file.get("filename")
        url = file.get("url")
        if not filename or not url:
            continue
        normalized_files.append(
            {
                "filename": filename,
                "url": url,
                "description": file.get("description"),
            }
        )

    return normalized_files or None


def _documentation_to_dto(settings: Documentation) -> SettingsDto:
    additional_docs = _normalize_additional_docs(settings.additional_docs)
    additional_files_raw = _normalize_additional_files(settings.additional_files)
    additional_files = None
    if additional_files_raw:
        additional_files = [
            AdditionalFileDto(
                filename=file["filename"],
                url=file["url"],
                description=file.get("description"),
            )
            for file in additional_files_raw
        ]
    return SettingsDto(
        id=settings.id,
        connection_id=settings.connection_id,
        project_key=settings.project_key,
        product_vision=settings.product_vision,
        product_scope=settings.product_scope,
        current_sprint_goals=settings.current_sprint_goals,
        glossary=settings.glossary,
        additional_docs=(
            [AdditionalDocDto(**doc) for doc in additional_docs]
            if additional_docs
            else None
        ),
        additional_files=additional_files,
        updated_at=settings.updated_at,
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


class SettingsService:
    def __init__(self, db: Session):
        self.db = db

    def get_settings(
        self, connection_id: str, project_key: str
    ) -> Optional[SettingsDto]:
        settings = (
            self.db.query(Documentation)
            .filter(
                Documentation.connection_id == connection_id,
                Documentation.project_key == project_key,
            )
            .first()
        )
        if not settings:
            return None
        return _documentation_to_dto(settings)

    def list_settings_by_connection(self, connection_id: str) -> List[SettingsDto]:
        settings_list = (
            self.db.query(Documentation)
            .filter(Documentation.connection_id == connection_id)
            .all()
        )
        return [_documentation_to_dto(s) for s in settings_list]

    def create_settings(
        self, connection_id: str, project_key: str, request: CreateSettingsRequest
    ) -> SettingsDto:
        existing = (
            self.db.query(Documentation)
            .filter(
                Documentation.connection_id == connection_id,
                Documentation.project_key == project_key,
            )
            .first()
        )
        if existing:
            raise ValueError(
                f"Settings already exist for connection {connection_id} and project {project_key}"
            )

        settings = Documentation(
            connection_id=connection_id,
            project_key=project_key,
            product_vision=request.product_vision,
            product_scope=request.product_scope,
            current_sprint_goals=request.current_sprint_goals,
            glossary=request.glossary,
            additional_docs=(
                [doc.model_dump() for doc in request.additional_docs]
                if request.additional_docs is not None
                else None
            ),
            additional_files=(
                [file.model_dump() for file in request.additional_files]
                if request.additional_files is not None
                else None
            ),
        )
        self.db.add(settings)
        self.db.commit()
        self.db.refresh(settings)
        return _documentation_to_dto(settings)

    def update_settings(
        self,
        connection_id: str,
        project_key: str,
        request: UpdateSettingsRequest,
    ) -> SettingsDto:
        settings = (
            self.db.query(Documentation)
            .filter(
                Documentation.connection_id == connection_id,
                Documentation.project_key == project_key,
            )
            .first()
        )
        if not settings:
            raise ValueError(
                f"Settings not found for connection {connection_id} and project {project_key}"
            )

        if request.product_vision is not None:
            settings.product_vision = request.product_vision
        if request.product_scope is not None:
            settings.product_scope = request.product_scope
        if request.current_sprint_goals is not None:
            settings.current_sprint_goals = request.current_sprint_goals
        if request.glossary is not None:
            settings.glossary = request.glossary
        if request.additional_docs is not None:
            settings.additional_docs = [
                doc.model_dump() for doc in request.additional_docs
            ]
        if request.additional_files is not None:
            settings.additional_files = [
                file.model_dump() for file in request.additional_files
            ]

        self.db.add(settings)
        self.db.commit()
        self.db.refresh(settings)
        return _documentation_to_dto(settings)

    def delete_settings(self, connection_id: str, project_key: str) -> None:
        settings = (
            self.db.query(Documentation)
            .filter(
                Documentation.connection_id == connection_id,
                Documentation.project_key == project_key,
            )
            .first()
        )
        if not settings:
            raise ValueError(
                f"Settings not found for connection {connection_id} and project {project_key}"
            )
        self.db.delete(settings)
        self.db.commit()

    # --- File upload/download ---

    def upload_file(
        self,
        connection_id: str,
        project_key: str,
        file: UploadFile,
        description: Optional[str] = None,
    ) -> SettingsDto:
        settings = (
            self.db.query(Documentation)
            .filter(
                Documentation.connection_id == connection_id,
                Documentation.project_key == project_key,
            )
            .first()
        )
        if not settings:
            raise ValueError(
                f"Settings not found for connection {connection_id} and project {project_key}"
            )

        prefix = f"documentation/{connection_id}/{project_key}"
        file_info = upload_file(file, prefix)
        normalized_description = description.strip() if description else None

        current_files = settings.additional_files or []
        existing_entry = next(
            (f for f in current_files if f.get("filename") == file_info["filename"]),
            None,
        )
        file_info["description"] = (
            normalized_description
            if normalized_description is not None
            else existing_entry.get("description") if existing_entry else None
        )

        # Replace if same filename exists
        current_files = [
            f for f in current_files if f["filename"] != file_info["filename"]
        ]
        current_files.append(file_info)
        settings.additional_files = current_files

        self.db.add(settings)
        self.db.commit()
        self.db.refresh(settings)
        return _documentation_to_dto(settings)

    def download_file(self, connection_id: str, project_key: str, filename: str):
        settings = (
            self.db.query(Documentation)
            .filter(
                Documentation.connection_id == connection_id,
                Documentation.project_key == project_key,
            )
            .first()
        )
        if not settings:
            raise ValueError(
                f"Settings not found for connection {connection_id} and project {project_key}"
            )

        current_files = settings.additional_files or []
        file_entry = next((f for f in current_files if f["filename"] == filename), None)
        if not file_entry:
            raise FileNotFoundError(f"File {filename} not found")

        return download_file(file_entry["url"])

    def delete_file(
        self, connection_id: str, project_key: str, filename: str
    ) -> SettingsDto:
        settings = (
            self.db.query(Documentation)
            .filter(
                Documentation.connection_id == connection_id,
                Documentation.project_key == project_key,
            )
            .first()
        )
        if not settings:
            raise ValueError(
                f"Settings not found for connection {connection_id} and project {project_key}"
            )

        current_files = settings.additional_files or []
        file_entry = next((f for f in current_files if f["filename"] == filename), None)
        if not file_entry:
            raise FileNotFoundError(f"File {filename} not found")

        delete_file(file_entry["url"])
        settings.additional_files = [
            f for f in current_files if f["filename"] != filename
        ]

        self.db.add(settings)
        self.db.commit()
        self.db.refresh(settings)
        return _documentation_to_dto(settings)

    # --- Agent context ---

    def get_agent_context_input(
        self, connection_id: str, project_key: str
    ) -> ContextInput:
        settings = (
            self.db.query(Documentation)
            .filter(
                Documentation.connection_id == connection_id,
                Documentation.project_key == project_key,
            )
            .first()
        )
        if not settings:
            return None

        if not any(
            [
                settings.product_vision,
                settings.product_scope,
                settings.current_sprint_goals,
                settings.glossary,
                settings.additional_docs,
            ]
        ):
            return None

        # Get preferences for LLM context
        pref = (
            self.db.query(Preference)
            .filter(
                Preference.connection_id == connection_id,
                Preference.project_key == project_key,
            )
            .first()
        )

        llm_context = None
        if pref and pref.run_analysis_guidelines:
            llm_context = LlmContext(guidelines=pref.run_analysis_guidelines)

        return ContextInput(
            documentation=DocumentationInput(
                product_vision=settings.product_vision,
                product_scope=settings.product_scope,
                sprint_goals=settings.current_sprint_goals,
                glossary=settings.glossary,
                additional_docs=_normalize_additional_docs(settings.additional_docs),
            ),
            llm_context=llm_context,
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
