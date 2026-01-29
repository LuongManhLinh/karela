from fastapi import APIRouter, Depends, HTTPException
import traceback

from .services import ACService
from common.schemas import BasicResponse
from app.service_factory import (
    get_ac_service,
)
from app.auth_factory import get_jwt_payload


from .schemas import (
    ACCreateRequest,
    ACRegenerateRequest,
    ACUpdateRequest,
    AIRequest,
    AIResponse,
)

router = APIRouter(tags=["Gherkin AC"])


@router.post("/suggest", response_model=AIResponse)
async def suggest_ac(request: AIRequest, service: ACService = Depends(get_ac_service)):
    return await service.get_ai_suggestions(request)
    # return get_example_ai_response()


@router.get("/connections/{connection_name}")
async def list_acs_by_connection(
    connection_name: str,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        acs = service.list_acs_by_connection(
            user_id=user_id,
            connection_name=connection_name,
        )
        return BasicResponse(data=acs)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/connections/{connection_name}/projects/{project_key}")
async def list_acs_by_project(
    connection_name: str,
    project_key: str,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        acs = service.list_acs_by_project(
            user_id=user_id,
            connection_name=connection_name,
            project_key=project_key,
        )
        return BasicResponse(data=acs)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/connections/{connection_name}/projects/{project_key}/stories/{story_key}")
async def list_acs_by_story(
    connection_name: str,
    project_key: str,
    story_key: str,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        acs = service.list_acs_by_story(
            user_id=user_id,
            connection_name=connection_name,
            project_key=project_key,
            story_key=story_key,
        )
        return BasicResponse(data=acs)
    except ValueError as e:
        traceback.print_exc()
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/connections/{connection_id}/projects/{project_key}/stories/{story_key}")
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
        ac_id = service.create_ac(
            connection_id=connection_id,
            project_key=project_key,
            story_key=story_key,
            gen_with_ai=ac_data.gen_with_ai,
        )
        return BasicResponse(data=ac_id)
    except ValueError as e:
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/connections/{connection_name}/items/{ac_id_or_key}")
async def get_ac(
    connection_name: str,
    ac_id_or_key: str,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        ac = service.get_ac(
            user_id=user_id,
            connection_name=connection_name,
            ac_id_or_key=ac_id_or_key,
        )
        return BasicResponse(data=ac)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{ac_id}/regenerate")
async def regenerate_ac(
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
            ac_id=ac_id,
            content=ac_data.content,
            feedback=ac_data.feedback,
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{ac_id}")
async def update_ac(
    ac_id: str,
    ac_data: ACUpdateRequest,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        ac = service.update_ac(
            ac_id=ac_id,
            content=ac_data.content,
        )
        return BasicResponse(data=ac)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{ac_id}")
async def delete_ac(
    ac_id: str,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        service.delete_ac(
            ac_id=ac_id,
        )
        return BasicResponse(detail="AC deleted successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{ac_id}/story")
async def get_story_by_ac(
    ac_id: str,
    service: ACService = Depends(get_ac_service),
    jwt_payload=Depends(get_jwt_payload),
):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    try:
        story_dto = service.get_story_by_ac(
            ac_id=ac_id,
        )
        return BasicResponse(data=story_dto)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
