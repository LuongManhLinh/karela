from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import traceback
import random


from common.database import get_db
from .services import ACService
from .schemas import (
    ACCreateRequest,
    ACUpdate,
    ACResponse,
    AIRequest,
    AIResponse,
    AISuggestion,
)

router = APIRouter(tags=["Gherkin AC"])


@router.get("/stories/{story_id}/acs", response_model=List[ACResponse])
def get_acs(story_id: str, db: Session = Depends(get_db)):
    service = ACService(db)
    return service.get_acs(story_id)


@router.post("/", response_model=ACResponse)
def create_ac(ac_data: ACCreateRequest, db: Session = Depends(get_db)):
    service = ACService(db)
    try:
        return service.create_ac(ac_data)
    except ValueError as e:
        traceback.print_exc()
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{ac_id}", response_model=ACResponse)
def update_ac(ac_id: str, ac_data: ACUpdate, db: Session = Depends(get_db)):
    service = ACService(db)
    try:
        return service.update_ac(ac_id, ac_data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{ac_id}")
def delete_ac(ac_id: str, db: Session = Depends(get_db)):
    service = ACService(db)
    try:
        service.delete_ac(ac_id)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/suggest", response_model=AIResponse)
async def suggest_ac(request: AIRequest, db: Session = Depends(get_db)):
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

    random_suggestion = random.choice(example_suggestions)
    return AIResponse(suggestions=[random_suggestion])
    service = ACService(db)
    return await service.get_ai_suggestions(request)
