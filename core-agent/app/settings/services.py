from sqlalchemy.orm import Session
from typing import Optional, List

from common.agents.input_schemas import ContextInput, Documentation, LlmContext
from .models import Settings
from .schemas import SettingsDto, CreateSettingsRequest, UpdateSettingsRequest


class SettingsService:
    def __init__(self, db: Session):
        self.db = db

    def get_settings(
        self, connection_id: str, project_key: str
    ) -> Optional[SettingsDto]:
        settings = (
            self.db.query(Settings)
            .filter(
                Settings.connection_id == connection_id,
                Settings.project_key == project_key,
            )
            .first()
        )
        if not settings:
            return None
        return SettingsDto(
            id=settings.id,
            connection_id=settings.connection_id,
            project_key=settings.project_key,
            product_vision=settings.product_vision,
            product_scope=settings.product_scope,
            current_sprint_goals=settings.current_sprint_goals,
            glossary=settings.glossary,
            additional_docs=settings.additional_docs,
            llm_guidelines=settings.llm_guidelines,
            updated_at=settings.updated_at,
        )

    def list_settings_by_connection(self, connection_id: str) -> List[SettingsDto]:
        settings_list = (
            self.db.query(Settings)
            .filter(Settings.connection_id == connection_id)
            .all()
        )
        return [
            SettingsDto(
                id=s.id,
                connection_id=s.connection_id,
                project_key=s.project_key,
                product_vision=s.product_vision,
                product_scope=s.product_scope,
                current_sprint_goals=s.current_sprint_goals,
                glossary=s.glossary,
                additional_docs=s.additional_docs,
                llm_guidelines=s.llm_guidelines,
                updated_at=s.last_updated,
            )
            for s in settings_list
        ]

    def create_settings(self, request: CreateSettingsRequest) -> SettingsDto:
        # Check if settings already exist
        existing = (
            self.db.query(Settings)
            .filter(
                Settings.connection_id == request.connection_id,
                Settings.project_key == request.project_key,
            )
            .first()
        )
        if existing:
            raise ValueError(
                f"Settings already exist for connection {request.connection_id} and project {request.project_key}"
            )

        settings = Settings(
            connection_id=request.connection_id,
            project_key=request.project_key,
            product_vision=request.product_vision,
            product_scope=request.product_scope,
            current_sprint_goals=request.current_sprint_goals,
            glossary=request.glossary,
            additional_docs=request.additional_docs,
            llm_guidelines=request.llm_guidelines,
        )
        self.db.add(settings)
        self.db.commit()
        self.db.refresh(settings)

        return SettingsDto(
            id=settings.id,
            connection_id=settings.connection_id,
            project_key=settings.project_key,
            product_vision=settings.product_vision,
            product_scope=settings.product_scope,
            current_sprint_goals=settings.current_sprint_goals,
            glossary=settings.glossary,
            additional_docs=settings.additional_docs,
            llm_guidelines=settings.llm_guidelines,
            updated_at=settings.updated_at,
        )

    def update_settings(
        self,
        connection_id: str,
        project_key: str,
        request: UpdateSettingsRequest,
    ) -> SettingsDto:
        settings = (
            self.db.query(Settings)
            .filter(
                Settings.connection_id == connection_id,
                Settings.project_key == project_key,
            )
            .first()
        )
        if not settings:
            raise ValueError(
                f"Settings not found for connection {connection_id} and project {project_key}"
            )

        # Update only provided fields
        if request.product_vision is not None:
            settings.product_vision = request.product_vision
        if request.product_scope is not None:
            settings.product_scope = request.product_scope
        if request.current_sprint_goals is not None:
            settings.current_sprint_goals = request.current_sprint_goals
        if request.glossary is not None:
            settings.glossary = request.glossary
        if request.additional_docs is not None:
            settings.additional_docs = request.additional_docs
        if request.llm_guidelines is not None:
            settings.llm_guidelines = request.llm_guidelines

        self.db.add(settings)
        self.db.commit()
        self.db.refresh(settings)

        return SettingsDto(
            id=settings.id,
            connection_id=settings.connection_id,
            project_key=settings.project_key,
            product_vision=settings.product_vision,
            product_scope=settings.product_scope,
            current_sprint_goals=settings.current_sprint_goals,
            glossary=settings.glossary,
            additional_docs=settings.additional_docs,
            llm_guidelines=settings.llm_guidelines,
            updated_at=settings.last_updated,
        )

    def delete_settings(self, connection_id: str, project_key: str) -> None:
        settings = (
            self.db.query(Settings)
            .filter(
                Settings.connection_id == connection_id,
                Settings.project_key == project_key,
            )
            .first()
        )
        if not settings:
            raise ValueError(
                f"Settings not found for connection {connection_id} and project {project_key}"
            )
        self.db.delete(settings)
        self.db.commit()

    def get_agent_context_input(
        self, connection_id: str, project_key: str
    ) -> ContextInput:
        settings = (
            self.db.query(Settings)
            .filter(
                Settings.connection_id == connection_id,
                Settings.project_key == project_key,
            )
            .first()
        )
        if not settings:
            return None

        # Return None if all the fields are empty
        if not any(
            [
                settings.product_vision,
                settings.product_scope,
                settings.current_sprint_goals,
                settings.glossary,
                # settings.constraints,
                settings.additional_docs,
                settings.llm_guidelines,
            ]
        ):
            return None

        return ContextInput(
            documentation=Documentation(
                product_vision=settings.product_vision,
                product_scope=settings.product_scope,
                sprint_goals=settings.current_sprint_goals,
                glossary=settings.glossary,
                # constraints=settings.constraints,
                additional_docs=settings.additional_docs,
            ),
            llm_context=LlmContext(
                guidelines=settings.llm_guidelines,
            ),
        )
