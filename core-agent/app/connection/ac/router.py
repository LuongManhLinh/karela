from fastapi import APIRouter, Depends
import random
from app.connection.ac.services import ACService
from app.service_factory import get_ac_service


from .schemas import (
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
