from fastapi import APIRouter, Depends, HTTPException
import traceback

from app.connection.ac.services import ACService
from app.user.services import UserService
from common.schemas import BasicResponse
from app.service_factory import (
    get_ac_service,
)
from app.auth_factory import get_jwt_payload
from app.connection.jira.services import JiraService


from .schemas import (
    ACCreateRequest,
    ACRegenerateRequest,
    ACUpdateRequest,
    AIRequest,
    AIResponse,
    AISuggestion,
)

router = APIRouter(tags=["Gherkin AC"])


def get_example_ai_response() -> AIResponse:
    example_suggestions = [
        AISuggestion(
            new_content="suggested content here",
            explanation="explanation for the suggestion",
            type="CREATE",
            position={
                "start_row": 1,
                "start_column": 0,
                "end_row": 1,
                "end_column": 20,
            },
        ),
        AISuggestion(
            new_content="updated content here",
            explanation="explanation for the update",
            type="UPDATE",
            position={
                "start_row": 1,
                "start_column": 0,
                "end_row": 1,
                "end_column": 25,
            },
        ),
        AISuggestion(
            new_content="deleted content",
            explanation="explanation for the deletion",
            type="DELETE",
            position={
                "start_row": 1,
                "start_column": 0,
                "end_row": 1,
                "end_column": 30,
            },
        ),
    ]

    # random_suggestion = random.choice(example_suggestions)
    random_suggestion = example_suggestions[0]
    return AIResponse(suggestions=[random_suggestion])


@router.post("/suggest", response_model=AIResponse)
async def suggest_ac(request: AIRequest, service: ACService = Depends(get_ac_service)):
    return await service.get_ai_suggestions(request)
    # return get_example_ai_response()


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
        if story_key == "none":
            acs = service.get_acs_by_project(
                user_id=user_id,
                connection_name=connection_name,
                project_key=project_key,
            )
        else:
            acs = service.get_acs_by_story(
                user_id=user_id,
                connection_id=connection_name,
                project_key=project_key,
                story_key=story_key,
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
        acs = service.get_acs_by_project(
            user_id=user_id,
            connection_name=connection_name,
            project_key=project_key,
        )
        return BasicResponse(data=acs)
    except ValueError as e:
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


@router.get(
    "/connections/{connection_name}/projects/{project_key}/stories/{story_key}/acs/{ac_id_key}"
)
async def get_ac(
    connection_name: str,
    project_key: str,
    story_key: str,
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
            project_key=project_key,
            story_key=story_key,
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
