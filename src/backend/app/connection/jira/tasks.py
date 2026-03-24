from common.redis_app import get_queue
from common.database import SessionLocal
from .services.sync_service import JiraSyncService


def _sync_projects(
    connection_id: str, project_keys: list[str], run_analysis_after_sync: bool
):
    db = SessionLocal()
    try:
        # Assuming JiraConnectionService is defined elsewhere
        service = JiraSyncService(db)
        service.sync_projects(connection_id, project_keys=project_keys)
        if run_analysis_after_sync:
            for project_key in project_keys:
                service._run_analysis_all(
                    connection_id=connection_id, project_key=project_key
                )
    finally:
        db.close()


def sync_projects(
    connection_id: str, project_keys: list[str], run_analysis_after_sync: bool
) -> str:
    job = get_queue("sync").enqueue(
        f=_sync_projects,
        connection_id=connection_id,
        project_keys=project_keys,
        run_analysis_after_sync=run_analysis_after_sync,
    )
    return job.id


def _setup_connection(connection_id: str):
    db = SessionLocal()
    try:
        service = JiraSyncService(db)
        service.setup_new_connection(connection_id)
    finally:
        db.close()


def setup_connection(connection_id: str) -> str:
    job = get_queue("sync").enqueue(
        f=_setup_connection,
        connection_id=connection_id,
    )
    return job.id
