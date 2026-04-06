from typing import Optional
import json
from sqlalchemy.orm import Session
from fastapi import UploadFile
from langchain.messages import AIMessage, ToolMessage

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
from uuid import uuid4


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
    ) -> list[TextDocumentationDto]:
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
        text_doc_count = (
            self.db.query(TextDocumentation)
            .filter(
                TextDocumentation.connection_id == connection_id,
                TextDocumentation.project_key == project_key,
            )
            .count()
        )

        doc = TextDocumentation(
            id=uuid_generator(),
            key=f"DOC-T-{text_doc_count + 1}",
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
    ) -> list[FileDocumentationDto]:
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

        file_doc_count = (
            self.db.query(FileDocumentation)
            .filter(
                FileDocumentation.connection_id == connection_id,
                FileDocumentation.project_key == project_key,
            )
            .count()
        )
        doc = FileDocumentation(
            id=uuid_generator(),
            key=f"DOC-F-{file_doc_count + 1}",
            connection_id=connection_id,
            project_key=project_key,
            name=file_info["filename"],
            url=file_info["url"],
            description=description.strip() if description else None,
        )
        self.db.add(doc)
        self.db.commit()
        self.db.refresh(doc)

        process_document_task(doc_id=doc.id, type="file")

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
    def list_all_docs_for_project(
        self, connection_id: str, project_key: str
    ) -> list[dict]:
        text_docs = (
            self.db.query(TextDocumentation)
            .filter(
                TextDocumentation.connection_id == connection_id,
                TextDocumentation.project_key == project_key,
            )
            .all()
        )

        file_docs = (
            self.db.query(FileDocumentation)
            .filter(
                FileDocumentation.connection_id == connection_id,
                FileDocumentation.project_key == project_key,
            )
            .all()
        )

        docs = []
        for doc in text_docs:
            docs.append(
                {
                    "key": doc.key,
                    "name": doc.name,
                    "description": doc.description,
                    "headers": doc.headers,
                }
            )

        for doc in file_docs:
            docs.append(
                {
                    "key": doc.key,
                    "name": doc.name,
                    "description": doc.description,
                    "headers": doc.headers,
                }
            )
        return docs

    def get_doc_id(self, connection_id: str, project_key: str, doc_key: str):
        text_doc = (
            self.db.query(TextDocumentation)
            .filter(
                TextDocumentation.connection_id == connection_id,
                TextDocumentation.project_key == project_key,
                TextDocumentation.key == doc_key,
            )
            .first()
        )

        file_doc = (
            self.db.query(FileDocumentation)
            .filter(
                FileDocumentation.connection_id == connection_id,
                FileDocumentation.project_key == project_key,
                FileDocumentation.key == doc_key,
            )
            .first()
        )

        doc = text_doc or file_doc
        if not doc:
            return None

        return doc.id

    def simulate_list_docs_messages(
        self, connection_id: str, project_key: str
    ) -> ToolMessage:
        ai_message = AIMessage(
            content=f"Listing all documentation for project {project_key}...",
            additional_kwargs={
                "function_call": {"name": "list_available_docs", "arguments": {}},
            },
        )
        docs = self.list_all_docs_for_project(connection_id, project_key)
        content = json.dumps({"docs": docs}, indent=2)
        tool_msg = ToolMessage(
            content=content,
            tool_call_id=str(uuid4()),
        )

        return [ai_message, tool_msg]

    def delete_all_docs(self, connection_id: str):
        text_docs = (
            self.db.query(TextDocumentation)
            .filter(TextDocumentation.connection_id == connection_id)
            .all()
        )

        file_docs = (
            self.db.query(FileDocumentation)
            .filter(FileDocumentation.connection_id == connection_id)
            .all()
        )

        for doc in text_docs:
            self.vectorstore.remove_chunks(documentation_id=doc.id)
            self.db.delete(doc)

        for doc in file_docs:
            try:
                delete_file(doc.url)
            except FileNotFoundError:
                pass  # Already gone
            self.vectorstore.remove_chunks(documentation_id=doc.id)
            self.db.delete(doc)

        self.db.commit()
