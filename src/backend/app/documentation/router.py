from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form

from common.schemas import BasicResponse
from app.service_factory import get_settings_service
from app.auth_factory import get_jwt_payload
from .schemas import (
    CreateTextDocumentationRequest,
    UpdateTextDocumentationRequest,
    UpdateFileDocumentationRequest,
)
import traceback
from .services import DocumentationService

router = APIRouter()


# ── Text Documentation ───────────────────────────────────────────────


@router.get("/projects/{project_key}/text-docs")
def list_text_docs(
    project_key: str,
    jwt_payload=Depends(get_jwt_payload),
    service: DocumentationService = Depends(get_settings_service),
):
    conn_id = jwt_payload.get("sub")
    if not conn_id:
        raise HTTPException(status_code=401, detail="Invalid JWT payload")
    docs = service.list_text_docs(conn_id, project_key)
    return BasicResponse(data=docs)


@router.post("/projects/{project_key}/text-docs")
def create_text_doc(
    project_key: str,
    request: CreateTextDocumentationRequest,
    service: DocumentationService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if not conn_id:
        raise HTTPException(status_code=401, detail="Invalid JWT payload")
    try:
        doc = service.create_text_doc(conn_id, project_key, request)
        return BasicResponse(detail="Text documentation created", data=doc)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/text-docs/{doc_id}")
def update_text_doc(
    doc_id: str,
    request: UpdateTextDocumentationRequest,
    service: DocumentationService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if not conn_id:
        raise HTTPException(status_code=401, detail="Invalid JWT payload")
    try:
        doc = service.update_text_doc(doc_id, request)
        return BasicResponse(detail="Text documentation updated", data=doc)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/text-docs/{doc_id}")
def delete_text_doc(
    doc_id: str,
    service: DocumentationService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if not conn_id:
        raise HTTPException(status_code=401, detail="Invalid JWT payload")
    try:
        service.delete_text_doc(doc_id)
        return BasicResponse(detail="Text documentation deleted")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── File Documentation ───────────────────────────────────────────────


@router.get("/projects/{project_key}/file-docs")
def list_file_docs(
    project_key: str,
    jwt_payload=Depends(get_jwt_payload),
    service: DocumentationService = Depends(get_settings_service),
):
    conn_id = jwt_payload.get("sub")
    if not conn_id:
        raise HTTPException(status_code=401, detail="Invalid JWT payload")
    docs = service.list_file_docs(conn_id, project_key)
    return BasicResponse(data=docs)


@router.post("/projects/{project_key}/file-docs")
def upload_file_doc(
    project_key: str,
    file: UploadFile = File(...),
    description: str | None = Form(None),
    service: DocumentationService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if not conn_id:
        raise HTTPException(status_code=401, detail="Invalid JWT payload")
    try:
        doc = service.create_file_doc(conn_id, project_key, file, description)
        return BasicResponse(detail="File documentation uploaded", data=doc)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/file-docs/{doc_id}")
def update_file_doc(
    doc_id: str,
    request: UpdateFileDocumentationRequest,
    service: DocumentationService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if not conn_id:
        raise HTTPException(status_code=401, detail="Invalid JWT payload")
    try:
        doc = service.update_file_doc(doc_id, request)
        return BasicResponse(detail="File documentation updated", data=doc)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/file-docs/{doc_id}")
def delete_file_doc(
    doc_id: str,
    service: DocumentationService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if not conn_id:
        raise HTTPException(status_code=401, detail="Invalid JWT payload")
    try:
        service.delete_file_doc(doc_id)
        return BasicResponse(detail="File documentation deleted")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/file-docs/{doc_id}/download")
def download_file_doc(
    doc_id: str,
    service: DocumentationService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if not conn_id:
        raise HTTPException(status_code=401, detail="Invalid JWT payload")
    try:
        return service.download_file_doc(doc_id)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))
