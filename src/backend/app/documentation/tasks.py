from common.redis_app import enqueue_task
from common.database import SessionLocal
from typing import Literal
from sqlalchemy.orm import Session
from .models import TextDocumentation, FileDocumentation
from .vectorstore import DocumentationVectorStore
from utils.file_processor import process_document
from utils.file_storage import download_file


def _process_doc(doc_id: str, type: str):
    db = SessionLocal()
    print("Starting document processing task for doc_id:", doc_id, "type:", type)
    vectorsore = DocumentationVectorStore()
    if type == "text":
        doc = db.query(TextDocumentation).filter(TextDocumentation.id == doc_id).first()
        if not doc:
            raise ValueError(f"Text documentation {doc_id} not found")

        _process_and_save_text_doc(
            db=db,
            doc=doc,
            connection_id=doc.connection_id,
            project_key=doc.project_key,
            vectorstore=vectorsore,
        )
    elif type == "file":
        doc = db.query(FileDocumentation).filter(FileDocumentation.id == doc_id).first()
        if not doc:
            raise ValueError(f"File documentation {doc_id} not found")
        _process_and_save_file_doc(
            db=db,
            doc=doc,
            connection_id=doc.connection_id,
            project_key=doc.project_key,
            vectorstore=vectorsore,
        )
    else:
        raise ValueError(f"Unknown documentation type: {type}")


def _process_and_save_text_doc(
    db: Session,
    vectorstore: DocumentationVectorStore,
    doc: TextDocumentation,
    connection_id: str,
    project_key: str,
):
    """Helper to process text content, save headers to DB, and chunks to vectorstore."""

    content_binary = doc.content.encode("utf-8")
    chunks, headers = process_document(file_binary=content_binary, extension=".md")

    doc.headers = headers
    db.add(doc)
    db.commit()

    vectorstore.remove_chunks(documentation_id=doc.id)
    if chunks:
        vectorstore.add_chunks(
            documentation_id=doc.id,
            connection_id=connection_id,
            project_key=project_key,
            doc_type="text",
            chunks=chunks,
        )


def _process_and_save_file_doc(
    db: Session,
    vectorstore: DocumentationVectorStore,
    doc: FileDocumentation,
    connection_id: str,
    project_key: str,
):
    """Helper to process file content, save headers to DB, and chunks to vectorstore."""
    try:
        file_bins_1 = download_file(doc.url, streaming=False)
        print("Length of downloaded file binary:", len(file_bins_1))
        chunks, headers = process_document(
            file_binary=file_bins_1, extension=doc.name.split(".")[-1]
        )
        print("Headers extracted from file:", headers)
        doc.headers = headers
        db.add(doc)
        db.commit()
        if chunks:
            vectorstore.add_chunks(
                documentation_id=doc.id,
                connection_id=connection_id,
                project_key=project_key,
                doc_type="file",
                chunks=chunks,
            )
    except Exception as e:
        print(f"Failed to process uploaded file {doc.name}: {e}")


def process_document_task(
    connection_id: str, doc_id: str, type: Literal["text", "file"]
):
    enqueue_task(
        f=_process_doc,
        queue_type="doc",
        doc_id=doc_id,
        type=type,
    )
