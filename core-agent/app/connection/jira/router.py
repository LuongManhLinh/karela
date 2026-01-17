# router.py
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import FileResponse, RedirectResponse
import httpx
import traceback

from app.service_factory import get_jira_service
from app.auth_factory import get_jwt_payload
from .services import JiraService
from .schemas import WebhookCallbackPayload
from common.configs import JiraConfig
from common.schemas import BasicResponse

router = APIRouter()


@router.get("/oauth/start")
async def oauth_start(jwt_payload=Depends(get_jwt_payload)):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    params = {
        "audience": "api.atlassian.com",
        "client_id": JiraConfig.CLIENT_ID,
        "scope": JiraConfig.SCOPES,
        "redirect_uri": JiraConfig.OAUTH_URL,
        "response_type": "code",
        "prompt": "consent",
        "state": user_id,
    }
    url = httpx.URL("https://auth.atlassian.com/authorize")
    for k, v in params.items():
        url = url.copy_add_param(k, v)
    return BasicResponse(
        detail="Redirecting to Jira OAuth",
        data=str(url),
    )


@router.get("/oauth/callback")
async def oauth_callback(
    request: Request, service: JiraService = Depends(get_jira_service)
):
    """Handle the OAuth callback from Jira.

    Returns:
        Redirect to frontend /oauth/callback with status parameter.
    """
    try:
        code = request.query_params.get("code")
        user_id = request.query_params.get("state")

        result_code = service.save_connection(
            user_id=user_id,
            code=code,
        )

        base_url = "http://localhost:3000/oauth/callback"

        if result_code == 1:
            return RedirectResponse(f"{base_url}?status=success")
        elif result_code == 2:
            return RedirectResponse(f"{base_url}?status=update")
        else:
            return RedirectResponse(f"{base_url}?status=failure")

    except Exception as e:
        print("Error during Jira OAuth callback:", str(e))
        traceback.print_exc()
        return RedirectResponse("http://localhost:3000/oauth/callback?status=failure")


@router.get("/oauth/callback/{css_file}", response_class=FileResponse)
async def oauth_callback_css(css_file: str):
    return FileResponse(f"resources/pages/{css_file}")


@router.post("/webhook/{connection_id}")
async def jira_webhook(
    connection_id: str,
    payload: WebhookCallbackPayload,
    service: JiraService = Depends(get_jira_service),
):
    """Handle incoming Jira webhooks.

    This endpoint is called by Jira when certain events occur, such as issue creation or updates.

    Args:
        connection_id (str): The ID of the Jira connection.
        project_id (str): The ID of the Jira project.
        issue_id (str): The ID of the Jira issue.
        request (Request): The incoming HTTP request containing the webhook payload.
        service (JiraService): The Jira service instance.
    Returns:
        BasicResponse: A response indicating success or failure of webhook processing.
    """
    # import json

    # print("Received payload:", json.dumps(payload, indent=2))
    # return

    service.handle_webhook(
        connection_id=connection_id,
        payload=payload,
    )
