import base64
from typing import List

import requests
from .schemas import SearchResponse, IssuesCreateRequest
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
            "fields": ",".join(fields) if fields else "*navigable",
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

    def get_issue(self, issue_key: str) -> dict:
        url = self.base_url + f"/rest/api/3/issue/{issue_key}"
        resp = requests.get(url, headers=self._auth_header, timeout=60)
        if not resp.ok:
            try:
                detail = resp.text
            except Exception:
                detail = ""
            raise RuntimeError(
                f"Jira get issue failed: {resp.status_code} {resp.reason} {detail}"
            )

        return resp.json()

    def get_settings(self, project_id, prop_key) -> dict:
        resp = self.get_properties(
            scope="project",
            id=project_id,
            prop_key=prop_key,
        )

        return resp["value"]

    def get_properties(self, scope: str, id: str, prop_key=None) -> dict:
        url = (
            self.base_url
            + f"/rest/api/3/{scope}/{id}/properties/"
            + (prop_key if prop_key else "")
        )
        resp = requests.get(url, headers=self._auth_header, timeout=60)
        if not resp.ok:
            try:
                detail = resp.text
            except Exception:
                detail = ""
            raise RuntimeError(
                f"Jira get issue properties failed: {resp.status_code} {resp.reason} {detail}"
            )

        return resp.json()

    def get_board_ids(self, project_key: str) -> List[int]:
        url = self.base_url + "/rest/agile/1.0/board"
        params = {"projectKeyOrId": project_key, "maxResults": "100", "type": "scrum"}
        resp = requests.get(url, headers=self._auth_header, params=params, timeout=60)
        if not resp.ok:
            try:
                detail = resp.text
            except Exception:
                detail = ""
            raise RuntimeError(
                f"Jira get boards failed: {resp.status_code} {resp.reason} {detail}"
            )
        data = resp.json()
        # Log data for debugging
        import json

        print("Board data response:", json.dumps(data, indent=2))
        board_ids = [board["id"] for board in data.get("values", [])]
        return board_ids

    def modify_issue(
        self, issue_id: str, title: str = None, description: str = None
    ) -> None:
        if not title and not description:
            return  # Nothing to modify
        url = self.base_url + f"/rest/api/3/issue/{issue_id}"
        fields = {}
        if title:
            fields["summary"] = title
        if description:
            fields["description"] = description
        payload = {"fields": fields}
        resp = requests.put(url, headers=self._auth_header, json=payload, timeout=60)
        if not resp.ok:
            try:
                detail = resp.text
            except Exception:
                detail = ""
            raise RuntimeError(
                f"Jira modify issue failed: {resp.status_code} {resp.reason} {detail}"
            )

    def modify_issues(self, issues: List[dict]) -> None:
        """Modify multiple issues based on the provided list of issue dicts.
        Each dict should contain 'id', and optionally 'title' and/or 'description'."""
        for issue in issues:
            if not issue.get("id"):
                continue
            self.modify_issue(
                issue_id=issue.get("id"),
                title=issue.get("title"),
                description=issue.get("description"),
            )

    def create_issues(self, issues: IssuesCreateRequest) -> List[str]:
        url = self.base_url + "/rest/api/3/issue/bulk"
        payload = issues.model_dump(by_alias=True)
        resp = requests.post(url, headers=self._auth_header, json=payload, timeout=60)
        if not resp.ok:
            try:
                detail = resp.text
            except Exception:
                detail = ""
            raise RuntimeError(
                f"Jira create issues failed: {resp.status_code} {resp.reason} {detail}"
            )
        return [issue["key"] for issue in resp.json().get("issues", [])]


default_client = JiraApiClient.from_env()
