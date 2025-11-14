# router.py
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
import httpx
import os
import json
from .schemas import IssuesCreateRequest

router = APIRouter()

CLIENT_ID = "PH25JOUU9w5XVOYjaaMxCYeqzdzOKtdY"
CLIENT_SECRET = (
    "ATOAtEKliEeQN4yFRSVEj1uPQv-_sdXukOJHjyjGKmhz6Z2rwlJmpW_zd_pODyz1xLu_6AC6DC16"
)
REDIRECT_URI = "https://ratsnake.lmlinh.com/api/v1/integrations/jira/oauth/callback"
SCOPES = "read:jira-work write:jira-work offline_access"
AUTH_URL = "https://auth.atlassian.com/authorize"
TOKEN_URL = "https://auth.atlassian.com/oauth/token"
API_BASE = "https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3"

# Simple file-store (not production safe)
TOKEN_FILE = "jira_tokens.json"
CLOUD_FILE = "jira_clouds.json"


def load_tokens():
    try:
        with open(TOKEN_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def save_tokens(tokens: dict):
    with open(TOKEN_FILE, "w") as f:
        json.dump(tokens, f)


def load_clouds():
    try:
        with open(CLOUD_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def save_clouds(clouds):
    with open(CLOUD_FILE, "w") as f:
        json.dump(clouds, f)


def get_cloud_id():
    clouds = load_clouds()
    if not clouds:
        raise HTTPException(status_code=400, detail="No cloud data available")
    # For simplicity, return the first cloud id
    return clouds[0]["id"]


@router.get("/oauth/start")
def oauth_start():
    params = {
        "audience": "api.atlassian.com",
        "client_id": CLIENT_ID,
        "scope": SCOPES,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "prompt": "consent",
    }
    url = "https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=PH25JOUU9w5XVOYjaaMxCYeqzdzOKtdY&scope=read%3Ajira-work%20manage%3Ajira-project%20manage%3Ajira-configuration%20read%3Ajira-user%20write%3Ajira-work%20manage%3Ajira-webhook%20manage%3Ajira-data-provider&redirect_uri=https%3A%2F%2Fratsnake.lmlinh.com%2Fapi%2Fv1%2Fintegrations%2Fjira%2Foauth%2Fcallback&state=${YOUR_USER_BOUND_VALUE}&response_type=code&prompt=consent"
    return RedirectResponse(str(url))


@router.get("/oauth/callback")
async def oauth_callback(request: Request):
    """
    Receive code and execute like this
    curl --request POST \
  --url 'https://auth.atlassian.com/oauth/token' \
  --header 'Content-Type: application/json' \
  --data '{"grant_type": "authorization_code","client_id": "YOUR_CLIENT_ID","client_secret": "YOUR_CLIENT_SECRET","code": "YOUR_AUTHORIZATION_CODE","redirect_uri": "https://YOUR_APP_CALLBACK_URL"}'

    Then receive cloud data id by execute like this
    curl --request GET \
  --url https://api.atlassian.com/oauth/token/accessible-resources \
  --header 'Authorization: Bearer ACCESS_TOKEN' \
  --header 'Accept: application/json'

    """
    code = request.query_params.get("code")
    print("OAuth callback received code:", code)
    if not code:
        raise HTTPException(status_code=400, detail="Missing code")

    import requests

    data = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "redirect_uri": REDIRECT_URI,
    }
    header = {"Content-Type": "application/json"}
    resp = requests.post(TOKEN_URL, json=data, headers=header)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=resp.status_code,
            detail="Token exchange failed with detail: "
            + resp.text
            + " status code: "
            + str(resp.status_code),
        )
    data = resp.json()
    access_token = data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token in response")
    save_tokens(data)

    cloud_resp = requests.get(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        },
    )
    if cloud_resp.status_code != 200:
        raise HTTPException(
            status_code=cloud_resp.status_code,
            detail="Failed to retrieve cloud resources with detail: "
            + cloud_resp.text
            + " status code: "
            + str(cloud_resp.status_code),
        )

    cloud_data = cloud_resp.json()
    save_clouds(cloud_data)

    return {"status": "tokens saved", "data": data, "clouds": cloud_data}


def get_auth_header():
    tokens = load_tokens()
    if not tokens or "access_token" not in tokens:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {"Authorization": f"Bearer {tokens['access_token']}"}


@router.post("/issues")
async def create_issue(payload: dict):
    # payload should include project key, issue type, summary, etc.
    cloud_id = get_cloud_id()
    url = API_BASE.format(cloud_id=cloud_id) + "/issue/bulk"
    headers = get_auth_header()
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers)
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


@router.get("/issues/{issue_key}")
async def get_issue(issue_key: str):
    cloud_id = get_cloud_id()
    url = API_BASE.format(cloud_id=cloud_id) + f"/issue/{issue_key}"
    headers = get_auth_header()
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


@router.put("/issues/{issue_key}")
async def update_issue(issue_key: str, payload: dict):
    cloud_id = get_cloud_id()
    url = API_BASE.format(cloud_id=cloud_id) + f"/issue/{issue_key}"
    headers = get_auth_header()
    async with httpx.AsyncClient() as client:
        resp = await client.put(url, json=payload, headers=headers)
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return {"status": "updated", "detail": resp.text}


@router.delete("/issues/{issue_key}")
async def delete_issue(issue_key: str):
    cloud_id = get_cloud_id()
    url = API_BASE.format(cloud_id=cloud_id) + f"/issue/{issue_key}"
    headers = get_auth_header()
    async with httpx.AsyncClient() as client:
        resp = await client.delete(url, headers=headers)
    if resp.status_code >= 400:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return {"status": "deleted"}
