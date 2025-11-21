# router.py
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import httpx
import traceback

from common.database import get_db
from common.fastapi_router import get_jwt_payload
from .services import JiraService
from common.configs import JiraConfig
from common.schemas import BasicResponse

router = APIRouter()


@router.get("/oauth/start")
async def oauth_start(jwt_payload=Depends(get_jwt_payload)):
    user_id = jwt_payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid JWT payload: missing sub")
    print("Starting OAuth flow for user_id:", user_id)
    params = {
        "audience": "api.atlassian.com",
        "client_id": JiraConfig.CLIENT_ID,
        "scope": JiraConfig.SCOPES,
        "redirect_uri": JiraConfig.REDIRECT_URI,
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


@router.get("/oauth/callback", response_class=FileResponse)
async def oauth_callback(request: Request, db: Session = Depends(get_db)):
    """Handle the OAuth callback from Jira.

    Returns:
        If successful, return the HTML page in `resources/pages/jira_oauth_success.html`.
        Otherwise, return the HTML page in `resources/pages/jira_oauth_failure.html`.
    """
    try:
        code = request.query_params.get("code")
        user_id = request.query_params.get("state")

        code = JiraService.save_connection(
            db=db,
            user_id=user_id,
            code=code,
        )
        if code == 1:
            return FileResponse("resources/pages/jira_oauth_success.html")
        elif code == 2:
            return FileResponse("resources/pages/jira_oauth_update.html")
        else:
            return FileResponse("resources/pages/jira_oauth_failure.html")

    except Exception as e:
        print("Error during Jira OAuth callback:", str(e))
        traceback.print_exc()
        return FileResponse("resources/pages/jira_oauth_failure.html")


@router.get("/oauth/callback/{css_file}", response_class=FileResponse)
async def oauth_callback_css(css_file: str):
    return FileResponse(f"resources/pages/{css_file}")
