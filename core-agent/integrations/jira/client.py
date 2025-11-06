import base64
from typing import List

import requests
from .schemas import SearchResponse
from config import JiraConfig


class JiraApiClient:
    def __init__(self, base_url: str, email: str, api_token: str) -> None:
        if not base_url.endswith("/"):
            base_url = base_url + "/"
        self.base_url = base_url
        self.email = email
        self.api_token = api_token
        creds = f"{email}:{api_token}".encode("utf-8")
        self._auth_header = {
            "Authorization": "Basic " + base64.b64encode(creds).decode("utf-8"),
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    @classmethod
    def from_env(cls) -> "JiraApiClient":
        base_url = JiraConfig.JIRA_BASE_URL
        email = JiraConfig.JIRA_EMAIL
        api_token = JiraConfig.JIRA_API_TOKEN

        if base_url and email and api_token:
            return cls(base_url, email, api_token)
        else:
            raise RuntimeError(
                "JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN must be set in environment variables."
            )

    def search_issues(
        self,
        jql: str,
        fields: List[str],
        max_results: int,
        expand_rendered_fields: bool = False,
    ) -> SearchResponse:
        url = self.base_url + "/rest/api/3/search/jql"
        params = {
            "jql": jql,
            "fields": ",".join(fields) if fields else "",
            "maxResults": str(max_results),
        }
        if expand_rendered_fields:
            params["expand"] = "renderedFields"

        resp = requests.get(url, headers=self._auth_header, params=params, timeout=60)
        if not resp.ok:
            try:
                detail = resp.text
            except Exception:
                detail = ""
            raise RuntimeError(
                f"Jira search failed: {resp.status_code} {resp.reason} {detail}"
            )

        return SearchResponse.model_validate(resp.json())
    
    def get_settings(
        self,
        project_id,
        prop_key
    ) -> dict:
        url = self.base_url + f"/rest/api/3/project/{project_id}/properties/{prop_key}"
        resp = requests.get(url, headers=self._auth_header, timeout=60)
        if not resp.ok:
            try:
                detail = resp.text
            except Exception:
                detail = ""
            raise RuntimeError(
                f"Jira get settings failed: {resp.status_code} {resp.reason} {detail}"
            )

        return resp.json()["value"]


default_client = JiraApiClient.from_env()
