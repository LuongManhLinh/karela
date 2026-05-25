from common.database import SessionLocal
from .services.sync_service import JiraSyncService
from rq.decorators import job
from common.redis_app import redis_client
from .schemas import SyncProjectsRequest
from .models import Connection, SyncStatus

import time


@job("sync", timeout=3600, connection=redis_client)
def sync_projects(
    connection_id: str, request: SyncProjectsRequest, timeout=1800, interval=5
):
    db = SessionLocal()
    connection = db.query(Connection).filter(Connection.id == connection_id).first()
    if not connection:
        raise ValueError("Connection not found")

    try:
        service = JiraSyncService(db)
        service._publish_status(
            connection=connection,
            status=SyncStatus.IN_PROGRESS,
            message="Processing documents...",
        )

        start = time.time()
        print("Start checking doc processing")
        while time.time() - start < timeout:
            doc_processing_count = redis_client.scard(f"doc_{connection_id}")
            if doc_processing_count == 0:
                print("Doc processing done.")
                break
            print(f"Doc progress: {doc_processing_count} remaining...")
            time.sleep(interval)

        project_context_map = {}
        project_keys = []
        run_analysis_keys = []
        for project in request.projects:
            project_keys.append(project.key)
            project_context_map[project.key] = project.description
            if project.run_analysis_after_sync:
                run_analysis_keys.append(project.key)

        service.sync_projects(
            connection=connection,
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
