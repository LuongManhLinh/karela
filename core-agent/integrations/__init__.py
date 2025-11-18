from sqlalchemy.orm import Session

from common.schemas import Platform
from .models import Connection
from .jira.services import JiraService


def get_platform_service(db: Session, connection_id: str):
    platform = (
        db.query(Connection.platform)
        .filter(Connection.platform_connection_id == connection_id)
        .one_or_none()
    )

    if platform is None:
        raise ValueError(f"Connection not found for id: {connection_id}")

    if platform == Platform.JIRA:
        return JiraService
    else:
        raise ValueError(f"Unsupported platform: {platform}")
