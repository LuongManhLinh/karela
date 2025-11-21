from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from common.schemas import BasicResponse
from common.database import get_db
from common.fastapi_router import get_jwt_payload
from .schemas import (
    SettingsDto,
    CreateSettingsRequest,
    UpdateSettingsRequest,
)
from .services import SettingsService

router = APIRouter()


@router.get("/connections/{connection_id}/projects/{project_key}")
def get_settings(
    connection_id: str,
    project_key: str,
    db: Session = Depends(get_db),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        settings = SettingsService.get_settings(db, connection_id, project_key)
        if settings is None:
            raise HTTPException(
                status_code=404,
                detail=f"Settings not found for connection {connection_id} and project {project_key}",
            )
        return BasicResponse(data=settings)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/connections/{connection_id}")
def list_settings(
    connection_id: str,
    db: Session = Depends(get_db),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        settings_list = SettingsService.list_settings_by_connection(db, connection_id)
        return BasicResponse(data=settings_list)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/connections/{connection_id}/projects/{project_key}")
def create_settings(
    connection_id: str,
    project_key: str,
    request: CreateSettingsRequest,
    db: Session = Depends(get_db),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        # Create new request with path parameters taking precedence
        create_request = CreateSettingsRequest(
            connection_id=connection_id,
            project_key=project_key,
            product_vision=request.product_vision,
            product_scope=request.product_scope,
            current_sprint_goals=request.current_sprint_goals,
            glossary=request.glossary,
            additional_docs=request.additional_docs,
            llm_guidelines=request.llm_guidelines,
        )
        settings = SettingsService.create_settings(db, create_request)
        return BasicResponse(detail="Settings created successfully", data=settings)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/connections/{connection_id}/projects/{project_key}")
def update_settings(
    connection_id: str,
    project_key: str,
    request: UpdateSettingsRequest,
    db: Session = Depends(get_db),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        settings = SettingsService.update_settings(
            db, connection_id, project_key, request
        )
        return BasicResponse(detail="Settings updated successfully", data=settings)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/connections/{connection_id}/projects/{project_key}")
def delete_settings(
    connection_id: str,
    project_key: str,
    db: Session = Depends(get_db),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        SettingsService.delete_settings(db, connection_id, project_key)
        return BasicResponse(detail="Settings deleted successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

