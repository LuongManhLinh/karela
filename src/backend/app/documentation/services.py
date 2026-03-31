from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import UploadFile

from common.agents.input_schemas import ContextInput
from common.agents.input_schemas import Documentation as DocumentationInput
from common.agents.input_schemas import LlmContext
from utils.file_storage import upload_file, download_file, delete_file
from common.database import uuid_generator

from .models import TextDocumentation, FileDocumentation
from .schemas import (
    TextDocumentationDto,
    CreateTextDocumentationRequest,
    UpdateTextDocumentationRequest,
    FileDocumentationDto,
    UpdateFileDocumentationRequest,
)
from .vectorstore import DocumentationVectorStore
from .tasks import process_document_task
from app.preference.models import Preference


def _text_doc_to_dto(doc: TextDocumentation) -> TextDocumentationDto:
    return TextDocumentationDto(
        id=doc.id,
        connection_id=doc.connection_id,
        project_key=doc.project_key,
        name=doc.name,
        description=doc.description,
        content=doc.content,
        headers=doc.headers,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


def _file_doc_to_dto(doc: FileDocumentation) -> FileDocumentationDto:
    return FileDocumentationDto(
        id=doc.id,
        connection_id=doc.connection_id,
        project_key=doc.project_key,
        name=doc.name,
        url=doc.url,
        description=doc.description,
        headers=doc.headers,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


class DocumentationService:
    def __init__(self, db: Session):
        self.db = db
        self.vectorstore = DocumentationVectorStore()

    # ── Text Documentation ──────────────────────────────────────────

    def list_text_docs(
        self, connection_id: str, project_key: str
    ) -> List[TextDocumentationDto]:
        docs = (
            self.db.query(TextDocumentation)
            .filter(
                TextDocumentation.connection_id == connection_id,
                TextDocumentation.project_key == project_key,
            )
            .all()
        )
        return [_text_doc_to_dto(doc) for doc in docs]

    def get_text_doc(self, doc_id: str) -> Optional[TextDocumentationDto]:
        doc = (
            self.db.query(TextDocumentation)
            .filter(TextDocumentation.id == doc_id)
            .first()
        )
        if not doc:
            return None
        return _text_doc_to_dto(doc)

    def create_text_doc(
        self,
        connection_id: str,
        project_key: str,
        request: CreateTextDocumentationRequest,
    ) -> TextDocumentationDto:
        doc = TextDocumentation(
            id=uuid_generator(),
            connection_id=connection_id,
            project_key=project_key,
            name=request.name.strip(),
            description=request.description.strip() if request.description else None,
            content=request.content,
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)

        if request.content:
            process_document_task(
                connection_id=connection_id, doc_id=doc.id, type="text"
            )

        return _text_doc_to_dto(doc)

    def update_text_doc(
        self, doc_id: str, request: UpdateTextDocumentationRequest
    ) -> TextDocumentationDto:
        doc = (
            self.db.query(TextDocumentation)
            .filter(TextDocumentation.id == doc_id)
            .first()
        )
        if not doc:
            raise ValueError(f"Text documentation {doc_id} not found")

        if request.description is not None:
            doc.description = (
                request.description.strip() if request.description.strip() else None
            )
        if request.content is not None:
            doc.content = request.content

        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)

        if request.content is not None and request.content != doc.content:
            process_document_task(
                connection_id=doc.connection_id, doc_id=doc.id, type="text"
            )

        return _text_doc_to_dto(doc)

    def delete_text_doc(self, doc_id: str) -> None:
        doc = (
            self.db.query(TextDocumentation)
            .filter(TextDocumentation.id == doc_id)
            .first()
        )
        if not doc:
            raise ValueError(f"Text documentation {doc_id} not found")

        self.vectorstore.remove_chunks(documentation_id=doc_id)
        self.db.delete(doc)
        self.db.commit()

    # ── File Documentation ──────────────────────────────────────────

    def list_file_docs(
        self, connection_id: str, project_key: str
    ) -> List[FileDocumentationDto]:
        docs = (
            self.db.query(FileDocumentation)
            .filter(
                FileDocumentation.connection_id == connection_id,
                FileDocumentation.project_key == project_key,
            )
            .all()
        )
        return [_file_doc_to_dto(doc) for doc in docs]

    def get_file_doc(self, doc_id: str) -> Optional[FileDocumentationDto]:
        doc = (
            self.db.query(FileDocumentation)
            .filter(FileDocumentation.id == doc_id)
            .first()
        )
        if not doc:
            return None
        return _file_doc_to_dto(doc)

    def create_file_doc(
        self,
        connection_id: str,
        project_key: str,
        file: UploadFile,
        description: Optional[str] = None,
    ) -> FileDocumentationDto:
        prefix = f"documentation/{connection_id}/{project_key}"

        # Upload to MinIO
        file_info = upload_file(file, prefix)

        doc = FileDocumentation(
            id=uuid_generator(),
            connection_id=connection_id,
            project_key=project_key,
            name=file_info["filename"],
            url=file_info["url"],
            description=description.strip() if description else None,
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)

        process_document_task(connection_id=connection_id, doc_id=doc.id, type="file")

        return _file_doc_to_dto(doc)

    def update_file_doc(
        self, doc_id: str, request: UpdateFileDocumentationRequest
    ) -> FileDocumentationDto:
        doc = (
            self.db.query(FileDocumentation)
            .filter(FileDocumentation.id == doc_id)
            .first()
        )
        if not doc:
            raise ValueError(f"File documentation {doc_id} not found")

        if request.description is not None:
            doc.description = (
                request.description.strip() if request.description.strip() else None
            )

        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)
        return _file_doc_to_dto(doc)

    def delete_file_doc(self, doc_id: str) -> None:
        doc = (
            self.db.query(FileDocumentation)
            .filter(FileDocumentation.id == doc_id)
            .first()
        )
        if not doc:
            raise ValueError(f"File documentation {doc_id} not found")

        # Remote from MinIO
        try:
            delete_file(doc.url)
        except FileNotFoundError:
            pass  # Already gone

        self.vectorstore.remove_chunks(documentation_id=doc_id)
        self.db.delete(doc)
        self.db.commit()

    def download_file_doc(self, doc_id: str):
        doc = (
            self.db.query(FileDocumentation)
            .filter(FileDocumentation.id == doc_id)
            .first()
        )
        if not doc:
            raise FileNotFoundError(f"File documentation {doc_id} not found")

        return download_file(doc.url)

    # ── Agent Context ───────────────────────────────────────────────

    def get_agent_context_input(
        self, connection_id: str, project_key: str
    ) -> ContextInput:
        """Constructs ContextInput dynamically from all project documentation and preferences."""

        text_docs = self.list_text_docs(connection_id, project_key)

        # We aggregate all text docs as additional_docs
        additional_docs = []
        for d in text_docs:
            if d.content:
                additional_docs.append(
                    {
                        "title": d.name,
                        "content": d.content,
                        "description": d.description,
                    }
                )

        # We no longer have product_vision, etc built-in. ContextInput supports additional_docs.
        doc_input = DocumentationInput(
            product_vision=None,
            product_scope=None,
            sprint_goals=None,
            glossary=None,
            additional_docs=additional_docs if additional_docs else None,
        )

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
            documentation=doc_input,
            llm_context=llm_context,
        )
