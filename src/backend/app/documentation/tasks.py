import traceback

from common.database import SessionLocal
from common.configs import MineruConfig
from sqlalchemy.orm import Session
from .models import TextDocumentation, FileDocumentation
from .vectorstore import DocumentationVectorStore
from utils.pdf2md import pdf2md_bytes
from utils.file_storage import download_file
from rq.decorators import job
from common.redis_app import redis_client
from langchain_text_splitters import MarkdownTextSplitter
import tiktoken
from markitdown import MarkItDown
import io


def _split_text_into_chunks(
    text: str, chunk_size: int = 1000, chunk_overlap: int = 200
):
    """Helper to split text into chunks using RecursiveCharacterTextSplitter."""
    text_splitter = MarkdownTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    return text_splitter.split_text(text)


def _count_tokens(text: str, model: str = "o200k_base") -> int:
    """Helper to count tokens in a text using tiktoken."""
    encoding = tiktoken.get_encoding(model)
    tokens = encoding.encode(text)
    return len(tokens)


def _docx_to_markdown(file_binary: bytes) -> str:
    """Helper to convert DOCX file binary to markdown string using markitdown."""
    try:
        converter = MarkItDown()
        md = converter.convert(io.BytesIO(file_binary))
        return md.markdown
    except Exception as e:
        print(f"Failed to convert DOCX to markdown: {e}")
        return ""


def _process_and_save_text_doc(
    db: Session,
    vectorstore: DocumentationVectorStore,
    docs: list[TextDocumentation],
):
    """Helper to process text content, save chunks to vectorstore."""
    for doc in docs:
        chunks = _split_text_into_chunks(doc.content)
        token_count = _count_tokens(doc.content)

        doc.token_count = token_count
        db.add(doc)

        vectorstore.remove_chunks(documentation_id=doc.id)
        if chunks:
            vectorstore.add_chunks(
                documentation_id=doc.id,
                connection_id=doc.connection_id,
                chunks=chunks,
            )
    db.commit()


def _process_and_save_file_doc(
    db: Session,
    vectorstore: DocumentationVectorStore,
    docs: list[FileDocumentation],
):
    """Helper to process file content, save chunks to vectorstore."""
    pdf_docs = []
    pdf_bins = []
    for doc in docs:
        file_bins = download_file(doc.url, streaming=False)
        extension = doc.name.split(".")[-1].lower()

        if extension == "pdf":
            pdf_docs.append(doc)
            pdf_bins.append(file_bins)
            continue
        elif extension == "docx" or extension == "doc":
            markdown = _docx_to_markdown(file_bins)
        else:
            # Text file
            markdown = file_bins.decode("utf-8")

        chunks = _split_text_into_chunks(markdown)
        token_count = _count_tokens(markdown)
        print(
            f"Processed file doc {doc.name} with {token_count} tokens and {len(chunks)} chunks"
        )

        doc.token_count = token_count
        db.add(doc)
        if chunks:
            vectorstore.add_chunks(
                documentation_id=doc.id,
                connection_id=doc.connection_id,
                chunks=chunks,
            )

    # Process PDF documents
    if pdf_docs:
        file_contents = [
            (f"{doc.id}.pdf", file_bin) for doc, file_bin in zip(pdf_docs, pdf_bins)
        ]
        result = pdf2md_bytes(
            files=file_contents, token=MineruConfig.TOKEN, poll_interval=5
        )
        for doc in pdf_docs:
            markdown = result.get(doc.id, None)
            if not markdown:
                markdown = result.get(f"{doc.id}.pdf", None)

            if not markdown:
                print(f"Failed to convert PDF {doc.id} to markdown")
                continue
            chunks = _split_text_into_chunks(markdown)
            token_count = _count_tokens(markdown)

            doc.token_count = token_count
            db.add(doc)
            print(
                f"Processed PDF doc {doc.name} with {token_count} tokens and {len(chunks)} chunks"
            )
            if chunks:
                vectorstore.add_chunks(
                    documentation_id=doc.id,
                    connection_id=doc.connection_id,
                    chunks=chunks,
                )

    db.commit()


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
            docs=[doc],
            vectorstore=vectorsore,
        )
    elif type == "file":
        doc = db.query(FileDocumentation).filter(FileDocumentation.id == doc_id).first()
        if not doc:
            raise ValueError(f"File documentation {doc_id} not found")
        _process_and_save_file_doc(
            db=db,
            docs=[doc],
            vectorstore=vectorsore,
        )
    else:
        raise ValueError(f"Unknown documentation type: {type}")


@job("doc", timeout=7200, connection=redis_client)
def process_bulk_docs_task(doc_tasks: list[dict]):
    print(
        f"Starting bulk documentation processing task with {len(doc_tasks)} documents..."
    )
    db = SessionLocal()
    vectorsore = DocumentationVectorStore()

    text_ids = []
    file_ids = []
    for task in doc_tasks:
        doc_id = task.get("doc_id")
        doc_type = task.get("type")
        if doc_type == "text":
            text_ids.append(doc_id)
        elif doc_type == "file":
            file_ids.append(doc_id)
        else:
            print(f"Unknown documentation type for doc_id {doc_id}: {doc_type}")

    text_docs = (
        db.query(TextDocumentation).filter(TextDocumentation.id.in_(text_ids)).all()
        if text_ids
        else []
    )

    file_docs = (
        db.query(FileDocumentation).filter(FileDocumentation.id.in_(file_ids)).all()
        if file_ids
        else []
    )

    _process_and_save_text_doc(db=db, docs=text_docs, vectorstore=vectorsore)
    _process_and_save_file_doc(db=db, docs=file_docs, vectorstore=vectorsore)
    print("Bulk documentation processing task completed successfully")
