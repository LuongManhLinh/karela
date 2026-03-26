from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from common.schemas import BasicResponse
from app.service_factory import get_settings_service, get_preference_service
from app.auth_factory import get_jwt_payload
from .schemas import (
    CreateSettingsRequest,
    UpdateSettingsRequest,
    CreatePreferenceRequest,
    UpdatePreferenceRequest,
)
from .services import SettingsService, PreferenceService

router = APIRouter()


# ── Documentation CRUD ───────────────────────────────────────────────


@router.get("/projects/{project_key}")
def get_settings(
    project_key: str,
    jwt_payload=Depends(get_jwt_payload),
    service: SettingsService = Depends(get_settings_service),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        settings = service.get_settings(conn_id, project_key)
        if settings is None:
            raise HTTPException(
                status_code=404,
                detail=f"Settings not found for connection {conn_id} and project {project_key}",
            )
        return BasicResponse(data=settings)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/")
def list_settings(
    service: SettingsService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    connection_id = jwt_payload.get("sub")
    if connection_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        settings_list = service.list_settings_by_connection(connection_id)
        return BasicResponse(data=settings_list)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/projects/{project_key}")
def create_settings(
    project_key: str,
    request: CreateSettingsRequest,
    service: SettingsService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    connection_id = jwt_payload.get("sub")
    if connection_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        settings = service.create_settings(
            connection_id=connection_id, project_key=project_key, request=request
        )
        return BasicResponse(detail="Settings created successfully", data=settings)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/projects/{project_key}")
def update_settings(
    project_key: str,
    request: UpdateSettingsRequest,
    service: SettingsService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    connection_id = jwt_payload.get("sub")
    if connection_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        settings = service.update_settings(connection_id, project_key, request)
        return BasicResponse(detail="Settings updated successfully", data=settings)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/projects/{project_key}")
def delete_settings(
    project_key: str,
    service: SettingsService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    connection_id = jwt_payload.get("sub")
    if connection_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        service.delete_settings(connection_id, project_key)
        return BasicResponse(detail="Settings deleted successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── File upload / download / delete ──────────────────────────────────


@router.post("/projects/{project_key}/files")
def upload_file(
    project_key: str,
    file: UploadFile = File(...),
    description: str | None = Form(None),
    service: SettingsService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    connection_id = jwt_payload.get("sub")
    if connection_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        settings = service.upload_file(connection_id, project_key, file, description)
        return BasicResponse(detail="File uploaded successfully", data=settings)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/projects/{project_key}/files/{filename}")
def download_file(
    project_key: str,
    filename: str,
    service: SettingsService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    connection_id = jwt_payload.get("sub")
    if connection_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        return service.download_file(connection_id, project_key, filename)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/projects/{project_key}/files/{filename}")
def delete_file(
    project_key: str,
    filename: str,
    service: SettingsService = Depends(get_settings_service),
    jwt_payload=Depends(get_jwt_payload),
):
    connection_id = jwt_payload.get("sub")
    if connection_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        settings = service.delete_file(connection_id, project_key, filename)
        return BasicResponse(detail="File deleted successfully", data=settings)
    except (ValueError, FileNotFoundError) as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Preference CRUD ──────────────────────────────────────────────────


@router.get("/preferences/projects/{project_key}")
def get_preference(
    project_key: str,
    jwt_payload=Depends(get_jwt_payload),
    service: PreferenceService = Depends(get_preference_service),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        pref = service.get_preference(conn_id, project_key)
        if pref is None:
            raise HTTPException(
                status_code=404,
                detail=f"Preference not found for connection {conn_id} and project {project_key}",
            )
        return BasicResponse(data=pref)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/preferences/projects/{project_key}")
def create_preference(
    project_key: str,
    request: CreatePreferenceRequest,
    service: PreferenceService = Depends(get_preference_service),
    jwt_payload=Depends(get_jwt_payload),
):
    connection_id = jwt_payload.get("sub")
    if connection_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        pref = service.create_preference(
            connection_id=connection_id, project_key=project_key, request=request
        )
        return BasicResponse(detail="Preference created successfully", data=pref)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/preferences/projects/{project_key}")
def update_preference(
    project_key: str,
    request: UpdatePreferenceRequest,
    service: PreferenceService = Depends(get_preference_service),
    jwt_payload=Depends(get_jwt_payload),
):
    connection_id = jwt_payload.get("sub")
    if connection_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        pref = service.update_preference(connection_id, project_key, request)
        return BasicResponse(detail="Preference updated successfully", data=pref)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
