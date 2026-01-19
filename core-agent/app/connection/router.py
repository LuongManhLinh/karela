from fastapi import APIRouter, Depends, HTTPException
import traceback

from app.connection.ac.services import ACService
from app.user.services import UserService
from common.schemas import BasicResponse
from app.service_factory import (
    get_user_service,
    get_jira_service,
    get_ac_service,
    get_dashboard_service,
)
from app.auth_factory import get_jwt_payload
from app.connection.jira.services import JiraService
from .ac.schemas import ACCreateRequest, ACRegenerateRequest
from .services import DashboardService

router = APIRouter()


@router.get("/")
async def list_connections(
    service: UserService = Depends(get_user_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        connections = service.get_connections(user_id)
        return BasicResponse(data=connections)

    except ValueError as e:
        traceback.print_exc()
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{connection_id_or_name}/projects")
async def list_projects(
    connection_id_or_name: str,
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        return BasicResponse(
            data=service.fetch_project_dtos(
                user_id=user_id, connection_id_or_name=connection_id_or_name
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{connection_id}/projects/{project_key}/stories")
async def list_stories(
    connection_id: str,
    project_key: str,
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        return BasicResponse(
            data=service.fetch_story_summaries(
                connection_id=connection_id,
                project_key=project_key,
            )
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{connection_id}")
async def delete_connection(
    connection_id: str,
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        service.delete_connection(user_id=user_id, connection_id=connection_id)
        return BasicResponse(detail="Connection deleted successfully")

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{connection_id}/projects/{project_key}/stories/{story_key}")
async def get_story_details(
    connection_id: str,
    project_key: str,
    story_key: str,
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        story = service.fetch_stories(
            connection_id=connection_id,
            project_key=project_key,
            story_keys=[story_key],
        )
        if not story:
            raise ValueError(f"Story with key {story_key} not found")
        return BasicResponse(data=story[0])
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{connection_id}/sync-status")
def get_connection_sync_status(
    connection_id: str,
    service: JiraService = Depends(get_jira_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        status_dto = service.get_connection_sync_status(
            user_id=user_id, connection_id_or_name=connection_id
        )
        return BasicResponse(data=status_dto)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{connection_id}/projects/{project_key}/stories/{story_key}/acs")
async def list_story_acs_by_story(
    connection_id: str,
    project_key: str,
    story_key: str,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        if story_key == "none":
            acs = service.get_acs_by_project(
                connection_id=connection_id,
                project_key=project_key,
            )
        else:
            acs = service.get_acs_by_story(
                connection_id=connection_id,
                project_key=project_key,
                story_key=story_key,
            )
        return BasicResponse(data=acs)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{connection_id}/projects/{project_key}/acs")
async def list_story_acs_by_project(
    connection_id: str,
    project_key: str,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        acs = service.get_acs_by_project(
            connection_id=connection_id,
            project_key=project_key,
        )
        return BasicResponse(data=acs)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{connection_id}/projects/{project_key}/stories/{story_key}/acs")
async def create_ac(
    connection_id: str,
    project_key: str,
    story_key: str,
    ac_data: ACCreateRequest,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        ac = service.create_ac(
            connection_id=connection_id,
            project_key=project_key,
            story_key=story_key,
            gen_with_ai=ac_data.gen_with_ai,
        )
        return BasicResponse(data=ac)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put(
    "/{connection_id}/projects/{project_key}/stories/{story_key}/acs/{ac_id}/regenerate"
)
async def regenerate_ac(
    connection_id: str,
    project_key: str,
    story_key: str,
    ac_id: str,
    ac_data: ACRegenerateRequest,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        service.regenerate_ac(
            connection_id=connection_id,
            project_key=project_key,
            story_key=story_key,
            ac_id=ac_id,
            content=ac_data.content,
            feedback=ac_data.feedback,
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{connection_id}/projects/{project_key}/stories/{story_key}/acs/{ac_id}")
async def get_ac(
    connection_id: str,
    project_key: str,
    story_key: str,
    ac_id: str,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        ac = service.get_ac(
            connection_id=connection_id,
            project_key=project_key,
            story_key=story_key,
            ac_id=ac_id,
        )
        return BasicResponse(data=ac)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{connection_id}/projects/{project_key}/stories/{story_key}/acs/{ac_id}")
async def update_ac(
    connection_id: str,
    project_key: str,
    story_key: str,
    ac_id: str,
    ac_data: ACCreateRequest,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        ac = service.update_ac(
            connection_id=connection_id,
            project_key=project_key,
            story_key=story_key,
            ac_id=ac_id,
            content=ac_data.content,
        )
        return BasicResponse(data=ac)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete(
    "/{connection_id}/projects/{project_key}/stories/{story_key}/acs/{ac_id}"
)
async def delete_ac(
    connection_id: str,
    project_key: str,
    story_key: str,
    ac_id: str,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        service.delete_ac(
            connection_id=connection_id,
            project_key=project_key,
            story_key=story_key,
            ac_id=ac_id,
        )
        return BasicResponse(detail="AC deleted successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{connection_id}/projects/{project_key}/dashboard")
async def get_project_dashboard_info(
    connection_id: str,
    project_key: str,
    service: DashboardService = Depends(get_dashboard_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        dashboard_info = service.get_project_dashboard_info(
            connection_id=connection_id,
            project_key=project_key,
        )
        return BasicResponse(data=dashboard_info)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{connection_id}/projects/{project_key}/stories/{story_key}/dashboard")
async def get_story_dashboard_info(
    connection_id: str,
    project_key: str,
    story_key: str,
    service: DashboardService = Depends(get_dashboard_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        dashboard_info = service.get_story_dashboard_info(
            connection_id=connection_id,
            project_key=project_key,
            story_key=story_key,
        )
        return BasicResponse(data=dashboard_info)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
