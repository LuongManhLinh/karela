from fastapi import APIRouter, Depends, HTTPException
import traceback

from app.connection.jira.schemas import SyncProjectsRequest
from app.connection.schemas import UpdateProjectDescriptionRequest
from common.schemas import BasicResponse
from app.service_factory import (
    get_jira_service,
    get_dashboard_service,
)
from app.auth_factory import get_jwt_payload
from app.connection.jira.services import JiraService
from .services import DashboardService

router = APIRouter()


@router.get("/")
async def get_connection(
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        connection = service.get_connection(connection_id=conn_id)
        return BasicResponse(data=connection)

    except ValueError as e:
        traceback.print_exc()
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/projects")
async def list_projects(
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        data = service.fetch_project_dtos(
            connection_id=conn_id,
        )
        return BasicResponse(data=data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/projects/{project_key}/stories")
async def list_stories(
    project_key: str,
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        return BasicResponse(
            data=service.fetch_story_summaries(
                connection_id=conn_id,
                project_key=project_key,
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/")
async def delete_connection(
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        service.delete_connection(connection_id=conn_id)
        return BasicResponse(detail="Connection deleted successfully")

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/stories/{story_key}")
async def get_story_details(
    story_key: str,
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        story = service.fetch_stories(
            connection_id=conn_id,
            story_keys=[story_key],
        )
        if not story:
            raise ValueError(f"Story with key {story_key} not found")
        return BasicResponse(data=story[0])
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/sync-status")
def get_connection_sync_status(
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        status_dto = service.get_connection_sync_status(connection_id=conn_id)
        return BasicResponse(data=status_dto)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/projects/{project_key}/dashboard")
async def get_project_dashboard_info(
    project_key: str,
    service: DashboardService = Depends(get_dashboard_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        dashboard_info = service.get_project_dashboard_info(
            connection_id=conn_id,
            project_key=project_key,
        )
        return BasicResponse(data=dashboard_info)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/projects/{project_key}/dashboard/stories")
async def get_project_dashboard_stories(
    project_key: str,
    skip: int = 0,
    limit: int = 10,
    service: DashboardService = Depends(get_dashboard_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        stories = service.get_paginated_stories(
            connection_id=conn_id,
            project_key=project_key,
            skip=skip,
            limit=limit,
        )
        return BasicResponse(data=stories)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/projects/{project_key}/stories/{story_key}/dashboard")
async def get_story_dashboard_info(
    project_key: str,
    story_key: str,
    service: DashboardService = Depends(get_dashboard_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        dashboard_info = service.get_story_dashboard_info(
            connection_id=conn_id,
            project_key=project_key,
            story_key=story_key,
        )
        return BasicResponse(data=dashboard_info)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/dashboard")
async def get_connection_dashboard_info(
    service: DashboardService = Depends(get_dashboard_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        dashboard_info = service.get_connection_dashboard_info(
            connection_id=conn_id,
        )
        return BasicResponse(data=dashboard_info)
    except ValueError as e:
        traceback.print_exc()
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/dashboard/projects")
async def get_connection_dashboard_projects(
    skip: int = 0,
    limit: int = 5,
    service: DashboardService = Depends(get_dashboard_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        projects = service.get_paginated_projects(
            connection_id=conn_id,
            skip=skip,
            limit=limit,
        )
        return BasicResponse(data=projects)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/projects/sync-status")
def get_projects_sync_status(
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        projects_sync_status = service.fetch_all_projects_checked_sync(
            connection_id=conn_id,
        )
        return BasicResponse(data=projects_sync_status)
    except ValueError as e:
        traceback.print_exc()
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/projects/sync")
def sync_projects(
    request: SyncProjectsRequest,
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        service.sync_projects(
            connection_id=conn_id,
            request=request,
        )
        return BasicResponse(detail="Projects sync initiated successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/projects/{project_key}/description")
def get_project_description(
    project_key: str,
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        description = service.get_project_description(
            connection_id=conn_id,
            project_key=project_key,
        )
        return BasicResponse(data=description)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/projects/{project_key}/description")
def update_project_description(
    project_key: str,
    request: UpdateProjectDescriptionRequest,
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    conn_id = jwt_payload.get("sub")
    if conn_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        service.update_project_description(
            connection_id=conn_id,
            project_key=project_key,
            description=request.description,
        )
        return BasicResponse(detail="Project description updated successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
