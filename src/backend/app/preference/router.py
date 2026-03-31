from fastapi import APIRouter, Depends, HTTPException

from common.schemas import BasicResponse
from app.service_factory import get_preference_service
from app.auth_factory import get_jwt_payload
from .schemas import (
    CreatePreferenceRequest,
    UpdatePreferenceRequest,
)
from .services import PreferenceService

router = APIRouter()


@router.get("/projects/{project_key}")
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


@router.post("/projects/{project_key}")
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


@router.put("/projects/{project_key}")
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
