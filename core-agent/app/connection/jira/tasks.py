from common.redis_app import task_queue
from common.database import SessionLocal
from .services.connect_service import JiraConnectService


def _update_connection(connection_id: str, new: bool = True):
    db = SessionLocal()
    try:
        # Assuming JiraConnectionService is defined elsewhere
        service = JiraConnectService(db)
        service.setup_connection(connection_id, new=new)
    finally:
        db.close()


def execute_update_connection(connection_id: str, new: bool = True) -> str:
    job = task_queue.enqueue(f=_update_connection, connection_id=connection_id, new=new)
    return job.id
