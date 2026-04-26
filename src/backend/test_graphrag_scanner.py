from app.analysis.graphrag.context_builder import _run_all_scanners
import json

conn_id = "sudo"
proj_key = "ORG5"

dict_1, dict_2 = _run_all_scanners(connection_id=conn_id, project_key=proj_key)


print(f"Scanner 1 Output for connection_id='{conn_id}' and project_key='{proj_key}':")
print(json.dumps(dict_1, indent=2))

print(f"\nScanner 2 Output for connection_id='{conn_id}' and project_key='{proj_key}':")
print(json.dumps(dict_2, indent=2))

# conn_id = "sudo"
# proj_key = "ORG51"

# dict_3, dict_4 = _run_all_scanners(connection_id=conn_id, project_key=proj_key)

# print(f"Scanner 3 Output for connection_id='{conn_id}' and project_key='{proj_key}':")
# print(json.dumps(dict_3, indent=2))

# print(f"\nScanner 4 Output for connection_id='{conn_id}' and project_key='{proj_key}':")
# print(json.dumps(dict_4, indent=2))
