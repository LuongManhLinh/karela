from common.database import SessionLocal
from typing import Literal
from sqlalchemy.orm import Session
from .models import TextDocumentation, FileDocumentation
from .vectorstore import DocumentationVectorStore
from utils.unstructured_file_processor import process_document
from utils.file_storage import download_file
from rq.decorators import job
from common.redis_app import redis_client


@job("doc", timeout=3600, connection=redis_client)
def process_document_task(doc_id: str, type: str):
    db = SessionLocal()
    vectorsore = DocumentationVectorStore()
    if type == "text":
        doc = db.query(TextDocumentation).filter(TextDocumentation.id == doc_id).first()
        if not doc:
            raise ValueError(f"Text documentation {doc_id} not found")

        _process_and_save_text_doc(
            db=db,
            doc=doc,
            vectorstore=vectorsore,
        )
    elif type == "file":
        doc = db.query(FileDocumentation).filter(FileDocumentation.id == doc_id).first()
        if not doc:
            raise ValueError(f"File documentation {doc_id} not found")
        _process_and_save_file_doc(
            db=db,
            doc=doc,
            vectorstore=vectorsore,
        )
    else:
        raise ValueError(f"Unknown documentation type: {type}")


def _process_and_save_text_doc(
    db: Session,
    vectorstore: DocumentationVectorStore,
    doc: TextDocumentation,
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
            connection_id=doc.connection_id,
            chunks=chunks,
        )


def _process_and_save_file_doc(
    db: Session,
    vectorstore: DocumentationVectorStore,
    doc: FileDocumentation,
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
                connection_id=doc.connection_id,
                chunks=chunks,
            )
    except Exception as e:
        print(f"Failed to process uploaded file {doc.name}: {e}")
