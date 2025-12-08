from sqlalchemy.orm import Session

from common.schemas import Platform
from .models import Connection
from .jira.services import JiraService


def get_platform_service(db: Session, connection_id: str):
    platform = (
        db.query(Connection.platform)
        .filter(Connection.platform_connection_id == connection_id)
        .first()
    )

    if platform is None:
        raise ValueError(f"Connection not found for id: {connection_id}")

    if platform[0].value == Platform.JIRA:
        return JiraService(db=db)
    else:
        raise ValueError(f"Unsupported platform: {platform}")
