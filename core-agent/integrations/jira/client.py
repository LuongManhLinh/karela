import requests
from typing import List, Optional

from utils.markdown_adf_bridge import md_to_adf
from .schemas import (
    IssuesCreateRequest,
    SearchResponse,
    Issue,
    ExchangeAutorizationCodeResponse,
    JiraCloudInfoResponse,
)


API_BASE = "https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3"


def _get_auth_header(access_token: str):
    return {"Authorization": f"Bearer {access_token}"}


class JiraClient:
    @staticmethod
    def exchange_authorization_code(
        client_id: str,
        client_secret: str,
        code: str,
        redirect_uri: str,
    ) -> ExchangeAutorizationCodeResponse:
        payload = {
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "redirect_uri": redirect_uri,
        }
        headers = {
            "Content-Type": "application/json",
        }
        resp = requests.post(
            "https://auth.atlassian.com/oauth/token", json=payload, headers=headers
        )
        resp.raise_for_status()
        return ExchangeAutorizationCodeResponse(**resp.json())

    @staticmethod
    def get_cloud_info(
        access_token: str,
    ) -> List[JiraCloudInfoResponse]:
        url = "https://api.atlassian.com/oauth/token/accessible-resources"
        headers = _get_auth_header(access_token)
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        json = resp.json()
        return [JiraCloudInfoResponse(**item) for item in json]

    @staticmethod
    def refresh_access_token(
        client_id: str,
        client_secret: str,
        refresh_token: str,
    ) -> str:
        url = "https://auth.atlassian.com/oauth/token"
        payload = {
            "grant_type": "refresh_token",
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh_token,
        }
        headers = {
            "Content-Type": "application/json",
        }
        resp = requests.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()["access_token"]

    @staticmethod
    def create_issues(cloud_id: str, access_token: str, payload: IssuesCreateRequest):
        url = API_BASE.format(cloud_id=cloud_id) + "/issue/bulk"
        headers = _get_auth_header(access_token)
        resp = requests.post(
            url, json=payload.model_dump_json(by_alias=True), headers=headers
        )
        resp.raise_for_status()

    @staticmethod
    def search_issues(
        cloud_id: str,
        access_token: str,
        jql: str,
        fields: List[str],
        max_results: int,
        expand_rendered_fields: bool = False,
    ) -> SearchResponse:
        url = API_BASE.format(cloud_id=cloud_id) + "/search/jql"
        params = {
            "jql": jql,
            "fields": ",".join(fields) if fields else "*navigable",
            "maxResults": str(max_results),
        }
        if expand_rendered_fields:
            params["expand"] = "renderedFields"

        resp = requests.get(
            url, headers=_get_auth_header(access_token), params=params, timeout=60
        )
        if not resp.ok:
            try:
                detail = resp.text
            except Exception:
                detail = ""
            raise RuntimeError(
                f"Jira search failed: {resp.status_code} {resp.reason} {detail}"
            )

        return SearchResponse(**resp.json())

    @staticmethod
    def update_issue(
        cloud_id: str,
        access_token: str,
        issue_key: str,
        summary: Optional[str] = None,
        description: Optional[str] = None,
    ):
        """Update issue summary and/or description

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token
            issue_key (str): Key of the issue to update
            summary (Optional[str], optional): New summary. Defaults to None.
            description (Optional[str], optional): New description in markdown. Defaults to None.
        """
        if not summary and not description:
            raise ValueError("At least one of summary or description must be provided")
        url = API_BASE.format(cloud_id=cloud_id) + f"/issue/{issue_key}"
        headers = _get_auth_header(access_token)
        fields = {}
        if summary:
            fields["summary"] = summary
        if description:
            fields["description"] = md_to_adf(description)
        payload = {"fields": fields}
        resp = requests.put(url, json=payload, headers=headers)
        resp.raise_for_status()

    @staticmethod
    def get_issue(
        cloud_id: str,
        access_token: str,
        issue_key: str,
        fields: List[str] = None,
        expand_rendered_fields: bool = False,
    ) -> Issue:
        url = API_BASE.format(cloud_id=cloud_id) + f"/issue/{issue_key}"
        params = {}
        if fields:
            params["fields"] = ",".join(fields)
        if expand_rendered_fields:
            params["expand"] = "renderedFields"
        resp = requests.get(
            url, headers=_get_auth_header(access_token), params=params, timeout=60
        )
        if not resp.ok:
            try:
                detail = resp.text
            except Exception:
                detail = ""
            raise RuntimeError(
                f"Jira get issue failed: {resp.status_code} {resp.reason} {detail}"
            )

        json = resp.json()
        print("Jira get issue response JSON:", json)

        return Issue(**json)

    @staticmethod
    def get_properties(
        cloud_id: str,
        access_token: str,
        scope: str,
        id: str,
        prop_key: Optional[str] = None,
    ) -> dict:
        url = API_BASE.format(cloud_id=cloud_id) + f"/{scope}/{id}/properties/"
        if prop_key:
            url += prop_key
        resp = requests.get(url, headers=_get_auth_header(access_token), timeout=60)
        if not resp.ok:
            try:
                detail = resp.text
            except Exception:
                detail = ""
            raise RuntimeError(
                f"Jira get issue properties failed: {resp.status_code} {resp.reason} {detail}"
            )

        return resp.json()

    @staticmethod
    def get_project_settings(
        cloud_id: str,
        access_token: str,
        project_id: str,
        setting_key: str,
    ) -> dict:
        resp = JiraClient.get_properties(
            cloud_id=cloud_id,
            access_token=access_token,
            scope="project",
            id=project_id,
            prop_key=setting_key,
        )

        return resp["value"]
