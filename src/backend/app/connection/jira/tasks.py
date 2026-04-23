from common.database import SessionLocal
from .services.sync_service import JiraSyncService
from rq.decorators import job
from common.redis_app import redis_client


@job("sync", timeout=3600, connection=redis_client)
def sync_projects(
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


@job("sync", timeout=3600, connection=redis_client)
def setup_connection(connection_id: str):
    db = SessionLocal()
    try:
        service = JiraSyncService(db)
        service.setup_new_connection(connection_id)
    finally:
        db.close()
