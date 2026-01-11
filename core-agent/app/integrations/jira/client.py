import requests
from typing import List, Literal, Optional
import json

from .schemas import (
    CreateIssuesRequest,
    IssueUpdate,
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
    def create_issues(cloud_id: str, access_token: str, payload: CreateIssuesRequest):
        url = API_BASE.format(cloud_id=cloud_id) + "/issue/bulk"
        headers = _get_auth_header(access_token)
        headers["Content-Type"] = "application/json"
        resp = requests.post(url, json=payload.model_dump(), headers=headers)
        resp.raise_for_status()
        resp_json = resp.json()
        created_issues = resp_json.get("issues", [])
        return [issue["key"] for issue in created_issues]

    @staticmethod
    def create_issue(cloud_id: str, access_token: str, payload: IssueUpdate):
        url = API_BASE.format(cloud_id=cloud_id) + "/issue"
        headers = _get_auth_header(access_token)
        headers["Content-Type"] = "application/json"
        resp = requests.post(url, json=payload.model_dump(), headers=headers)
        # Log the response for debugging
        resp.raise_for_status()

        return resp.json()["key"]

    @staticmethod
    def search_issues(
        cloud_id: str,
        access_token: str,
        jql: str,
        fields: List[str],
        max_results: int | None = None,
        expand_rendered_fields: bool = False,
    ) -> SearchResponse:
        url = API_BASE.format(cloud_id=cloud_id) + "/search/jql"
        params = {
            "jql": jql,
            "fields": ",".join(fields) if fields else "*navigable",
        }
        if max_results is not None:
            params["maxResults"] = str(max_results)
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
        description: Optional[any] = None,
    ):
        """Update issue summary and/or description

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token
            issue_key (str): Key of the issue to update
            summary (Optional[str], optional): New summary. Defaults to None.
            description (Optional[any], optional): New description. Defaults to None.
        """
        url = API_BASE.format(cloud_id=cloud_id) + f"/issue/{issue_key}"
        headers = _get_auth_header(access_token)
        fields = {}
        if summary is not None:
            fields["summary"] = summary
        if description is not None:
            fields["description"] = description
        payload = {"fields": fields}
        resp = requests.put(url, json=payload, headers=headers)
        resp.raise_for_status()

    @staticmethod
    def delete_issue(
        cloud_id: str,
        access_token: str,
        issue_key: str,
    ):
        """Delete an issue by its key

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token
            issue_key (str): Key of the issue to delete
        """
        url = API_BASE.format(cloud_id=cloud_id) + f"/issue/{issue_key}"
        headers = _get_auth_header(access_token)
        headers["Accept"] = "application/json"
        resp = requests.delete(url, headers=headers)
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

    @staticmethod
    def fetch_project_keys(
        cloud_id: str,
        access_token: str,
        max_results: int = 1000,
    ) -> List[str]:
        """Fetch all project keys from Jira

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token

        Returns:
            List[str]: List of project keys
        """
        url = API_BASE.format(cloud_id=cloud_id) + "/project/search"
        params = {
            "maxResults": str(max_results),
        }
        resp = requests.get(
            url, headers=_get_auth_header(access_token), params=params, timeout=60
        )
        if not resp.ok:
            try:
                detail = resp.text
            except Exception:
                detail = ""
            raise RuntimeError(
                f"Jira fetch projects failed: {resp.status_code} {resp.reason} {detail}"
            )

        json_data = resp.json()
        projects = json_data.get("values", [])
        return [project["key"] for project in projects]

    @staticmethod
    def fetch_projects(
        cloud_id: str,
        access_token: str,
        max_results: int = 1000,
    ) -> List[dict]:
        """Fetch all project info from Jira

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token
        Returns:
            List[dict]: List of project info dictionaries, including id, key and name
        """
        url = API_BASE.format(cloud_id=cloud_id) + "/project/search"
        params = {
            "maxResults": str(max_results),
        }
        resp = requests.get(
            url, headers=_get_auth_header(access_token), params=params, timeout=60
        )
        if not resp.ok:
            try:
                detail = resp.text
            except Exception:
                detail = ""
            raise RuntimeError(
                f"Jira fetch projects failed: {resp.status_code} {resp.reason} {detail}"
            )

        json_data = resp.json()
        projects = json_data.get("values", [])
        return [
            {"id": project["id"], "key": project["key"], "name": project["name"]}
            for project in projects
        ]

    @staticmethod
    def fetch_story_keys(
        cloud_id: str,
        access_token: str,
        project_key: str,
    ) -> List[str]:
        """Fetch all story issue keys for a specific project

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token
            project_key (str): The project key to fetch stories from

        Returns:
            List[str]: List of story issue keys
        """
        url = API_BASE.format(cloud_id=cloud_id) + "/search/jql"
        jql = f'project = "{project_key}" AND issuetype = "Story" ORDER BY created ASC'
        params = {
            "jql": jql,
            "fields": "key",
            "maxResults": "1000",
        }
        resp = requests.get(
            url, headers=_get_auth_header(access_token), params=params, timeout=60
        )
        if not resp.ok:
            try:
                detail = resp.text
            except Exception:
                detail = ""
            raise RuntimeError(
                f"Jira fetch story keys failed: {resp.status_code} {resp.reason} {detail}"
            )

        json_data = resp.json()
        issues = json_data.get("issues", [])
        return [issue["key"] for issue in issues]

    @staticmethod
    def create_issue_type(
        cloud_id: str,
        access_token: str,
        name: str,
        description: Optional[str] = None,
        level: Literal["standard", "subtask"] = "standard",
    ) -> str:
        """Create a new issue type in Jira

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token
            name (str): Name of the issue type
            description (Optional[str], optional): Description of the issue type. Defaults to None.
            type (str, optional): Type of the issue type ("standard" or "subtask"). Defaults to "standard".
            avatar_url (Optional[str], optional): URL of the avatar image. Defaults to None.
            x (int, optional): X coordinate for cropping the avatar. Defaults to 0.
            y (int, optional): Y coordinate for cropping the avatar. Defaults to 0.
            width (int, optional): Width for cropping the avatar. Defaults to 64.
            height (int, optional): Height for cropping the avatar. Defaults to 64.
        Returns:
            str: ID of the created issue type
        """
        url = API_BASE.format(cloud_id=cloud_id) + "/issuetype"
        headers = _get_auth_header(access_token)
        headers["Content-Type"] = "application/json"
        payload = {
            "name": name,
            "description": description,
            "type": level,
        }
        resp = requests.post(url, json=payload, headers=headers)
        resp.raise_for_status()

        return resp.json()["id"]

    @staticmethod
    def create_issue_type_avatar(
        cloud_id: str,
        access_token: str,
        issue_type_id: str,
        avatar_url: str,
        x: int = 0,
        y: int = 0,
        width: int = 64,
        height: int = 64,
    ) -> str:
        """Crop and confirm the avatar for issue type

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token
            temporary_data_id (str): Temporary data ID
            x (int): X coordinate for cropping
            y (int): Y coordinate for cropping
            width (int): Width of the cropping area
            height (int): Height of the cropping area
        Returns:
            str: Confirmed avatar ID
        """
        url = API_BASE.format(cloud_id=cloud_id) + f"/issuetype/{issue_type_id}/avatar"
        headers = _get_auth_header(access_token)
        headers["Content-Type"] = "application/json"
        headers["Accept"] = "application/json"
        headers["X-Atlassian-Token"] = "no-check"
        payload = {
            "cropperOffsetX": x,
            "cropperOffsetY": y,
            "cropperWidth": width,
            "cropperHeight": height,
            "url": avatar_url,
        }
        resp = requests.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.json()["id"]

    def add_issue_type_to_activated_schemes(
        cloud_id: str,
        access_token: str,
        issue_type_id: str,
    ):
        """Add an existing issue type to a project

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token
            project_id (str): Project ID to add the issue type to
            issue_type_id (str): Issue type ID to add
        """
        # First, get the issue type scheme for the project
        get_url = API_BASE.format(cloud_id=cloud_id) + f"/issuetypescheme"
        headers = _get_auth_header(access_token)
        headers["Accept"] = "application/json"

        issue_type_scheme_resp = requests.get(
            get_url,
            headers=headers,
        )
        issue_type_scheme_resp.raise_for_status()

        all_schemes = issue_type_scheme_resp.json().get("values", [])
        if not all_schemes:
            raise RuntimeError(
                f"Jira get issue type scheme failed: No issue type schemes found"
            )

        headers["Content-Type"] = "application/json"
        for scheme in all_schemes:
            # Add the issue type to the scheme
            scheme_id = scheme["id"]
            print(
                f"Adding issue type to scheme: {scheme.get('name', 'Unknown')} ({scheme_id})"
            )
            add_url = (
                API_BASE.format(cloud_id=cloud_id)
                + f"/issuetypescheme/{scheme_id}/issuetype"
            )
            payload = {
                "issueTypeIds": [str(issue_type_id)],
            }
            add_resp = requests.put(add_url, headers=headers, json=payload)

            if not add_resp.ok:
                print(
                    f"Failed to add issue type to scheme {scheme_id}: {add_resp.status_code} {add_resp.reason} {add_resp.text}  {json.dumps(payload)}"
                )

    def get_issue_type_by_name(
        cloud_id: str,
        access_token: str,
        name: str,
    ) -> Optional[dict]:
        """Get issue type by name

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token
            name (str): Name of the issue type

        Returns:
            Optional[dict]: Issue type dictionary if found, else None
        """
        print("Fetching issue types to find:", name)
        url = API_BASE.format(cloud_id=cloud_id) + "/issuetype"
        headers = _get_auth_header(access_token)
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        issue_types = resp.json()
        for issue_type in issue_types:
            if issue_type["name"].lower() == name.lower():
                return issue_type["id"]
        return None

    @staticmethod
    def register_webhook(
        cloud_id: str,
        access_token: str,
        url: str,
        events: List[str],
    ) -> str:
        """Register a webhook in Jira

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token
            name (str): Name of the webhook
            url (str): URL to receive webhook events
            events (List[str]): List of events to subscribe to
            jql_filter (Optional[str], optional): JQL filter for the webhook. Defaults to None.

        Returns:
            str: ID of the registered webhook
        """
        # api_url = WEBHOOK_API_BASE.format(cloud_id=cloud_id)
        api_url = API_BASE.format(cloud_id=cloud_id) + "/webhook"
        headers = _get_auth_header(access_token)
        headers["Content-Type"] = "application/json"

        webhooks_payload = {
            "events": events,
            "jqlFilter": "project != 'CJtYW5hZ2U6amlyYS1jb25maWd1cmF0aW9uI'",
        }

        payload = {
            "url": url,
            "webhooks": [webhooks_payload],
        }

        resp = requests.post(api_url, json=payload, headers=headers)
        resp.raise_for_status()
        print("Jira webhook registration response:", resp.status_code, resp.text)
        return resp.json()

    @staticmethod
    def get_webhooks(
        cloud_id: str,
        access_token: str,
    ) -> List[dict]:
        """Get all webhooks in Jira

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token

        Returns:
            List[dict]: List of webhooks
        """
        api_url = API_BASE.format(cloud_id=cloud_id) + "/webhook"
        headers = _get_auth_header(access_token)
        resp = requests.get(api_url, headers=headers)
        resp.raise_for_status()
        return resp.json()

    @staticmethod
    def delete_webhooks(
        cloud_id: str,
        access_token: str,
        webhook_ids: list[str],
    ):
        """Delete a webhook in Jira

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token
            webhook_id (str): ID of the webhook to delete
        """
        api_url = API_BASE.format(cloud_id=cloud_id) + f"/webhook"
        headers = _get_auth_header(access_token)
        payload = {
            "webhookIds": webhook_ids,
        }
        resp = requests.delete(api_url, headers=headers, json=payload)
        resp.raise_for_status()

    @staticmethod
    def refresh_webhooks(
        cloud_id: str,
        access_token: str,
        webhook_ids: list[str],
    ):
        """Refresh a webhook in Jira by deleting and re-registering it

        Args:
            cloud_id (str): Jira cloud ID
            access_token (str): OAuth2 access token
            webhook_id (str): ID of the webhook to refresh
            url (str): URL to receive webhook events
            events (List[str]): List of events to subscribe to
        """
        api_url = API_BASE.format(cloud_id=cloud_id) + f"/webhook/refresh"
        headers = _get_auth_header(access_token)
        payload = {
            "webhookIds": webhook_ids,
        }
        resp = requests.put(api_url, headers=headers, json=payload)
        resp.raise_for_status()
