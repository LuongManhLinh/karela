from app.analysis.agents.all import run_analysis
from app.connection.jira.services import JiraService
from common.database import get_db
import json

# Measure time taken for the ALL analysis workflow on the TEST project with the current taxonomy data. Adjust batch sizes in graph.py if needed to test different configurations.

import time

start_time = time.time()

conn_id = "515b536d-ab6f-4c9c-9e8e-caf2147d0aed"
project_key = "IB2"

jira_service = JiraService(db=next(get_db()))
project_desc = jira_service.get_project_description(
    connection_id=conn_id, project_key=project_key
)

defects = run_analysis(
    connection_id=conn_id,
    project_key=project_key,
    db=next(get_db()),
    self_batch_size=20,
    group_story=True,
    project_description=project_desc,
)

end_time = time.time()
print(f"ALL analysis completed in {end_time - start_time:.2f} seconds")

with open(f"data/IntelligenceBank/defect/gemini/{project_key}_defects.json", "w") as f:
    json.dump([defect.model_dump() for defect in defects], f, indent=2)
