from common.neo4j_app import delete_bucket_safe
from app.xgraphrag.db.importer import import_from_graphrag_output

conn_id = "sudo"
proj_key = "ORG5"

delete_bucket_safe(f"{conn_id}_{proj_key}")
import_from_graphrag_output(connection_id=conn_id, project_key=proj_key)

proj_key = "ORG51"

delete_bucket_safe(f"{conn_id}_{proj_key}")
import_from_graphrag_output(connection_id=conn_id, project_key=proj_key)
