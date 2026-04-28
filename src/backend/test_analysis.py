from app.analysis.agents.all import run_analysis
from common.database import get_db
import json

# Measure time taken for the ALL analysis workflow on the TEST project with the current taxonomy data. Adjust batch sizes in graph.py if needed to test different configurations.

import time

start_time = time.time()

defects = run_analysis(
    connection_id="sudo",
    project_key="TEST",
    db=next(get_db()),
    self_batch_size=20,
)

with open("data/test/results/defects_output.json", "w") as f:
    json.dump([defect.model_dump() for defect in defects], f, indent=2)

end_time = time.time()
print(f"ALL analysis completed in {end_time - start_time:.2f} seconds")
