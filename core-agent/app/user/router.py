from fastapi import APIRouter, Depends, HTTPException
import traceback

from common.schemas import BasicResponse
from app.service_factory import get_user_service, get_jira_service
from app.auth_factory import get_jwt_payload
from .schemas import (
    RegisterUserRequest,
    AuthenticateUserRequest,
    ChangePasswordRequest,
    UserDto,
    UserConnections,
)
from .services import UserService
from app.integrations.jira.services import JiraService

router = APIRouter()


@router.post("/register")
def register_user(
    request: RegisterUserRequest, service: UserService = Depends(get_user_service)
):
    try:
        service.register(
            username=request.username,
            password=request.password,
            email=request.email,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return BasicResponse(detail="User registered successfully")


@router.post("/")
def authenticate_user(
    request: AuthenticateUserRequest, service: UserService = Depends(get_user_service)
):
    try:
        token = service.authenticate(
            username_or_email=request.username_or_email,
            password=request.password,
        )
    except ValueError as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))
    return BasicResponse(detail="Authentication successful", data=token)


@router.get("/")
def get_current_user(
    jwt_payload=Depends(get_jwt_payload),
    service: UserService = Depends(get_user_service),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        user_dto: UserDto = service.get_user(user_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return BasicResponse(data=user_dto)


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    service: UserService = Depends(get_user_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        service.change_password(
            user_id,
            old_password=request.old_password,
            new_password=request.new_password,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return BasicResponse(detail="Password changed successfully")


@router.get("/connections")
def get_user_connections(
    service: UserService = Depends(get_user_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        connections: UserConnections = service.get_connections(user_id)
    except ValueError as e:
        traceback.print_exc()
        raise HTTPException(status_code=404, detail=str(e))
    return BasicResponse(data=connections)


@router.get("/connections/{connection_id_or_name}/projects")
def list_projects(
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


@router.get("/connections/{connection_id}/projects/{project_key}/issues")
def list_stories(
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


@router.delete("/connections/{connection_id}")
def delete_connection(
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
