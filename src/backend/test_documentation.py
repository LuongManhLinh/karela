from app.documentation.services import DocumentationService
from common.database import get_db
import json

service = DocumentationService(next(get_db()))
conn_id = "515b536d-ab6f-4c9c-9e8e-caf2147d0aed"
project_key = "VBS"

count = service.count_docs_for_project(conn_id, project_key)
print(f"Total documents for project {project_key}: {count}")

res = service.list_all_docs_for_project(conn_id, project_key)
print(json.dumps(res, indent=4))
