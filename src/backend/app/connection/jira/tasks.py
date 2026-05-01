from common.database import SessionLocal
from .services.sync_service import JiraSyncService
from rq.decorators import job
from common.redis_app import redis_client
from .schemas import SyncProjectsRequest


@job("sync", timeout=3600, connection=redis_client)
def sync_projects(connection_id: str, request: SyncProjectsRequest):
    db = SessionLocal()
    try:
        service = JiraSyncService(db)
        project_context_map = {}
        project_keys = []
        run_analysis_keys = []
        for project in request.projects:
            project_keys.append(project.key)
            project_context_map[project.key] = project.description
            if project.run_analysis_after_sync:
                run_analysis_keys.append(project.key)
        service.sync_projects(
            connection_id=connection_id,
            project_keys=project_keys,
            project_context_map=project_context_map,
        )

        for project_key in run_analysis_keys:
            service._run_analysis_all(
                connection_id=connection_id,
                project_key=project_key,
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
