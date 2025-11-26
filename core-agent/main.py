import subprocess
import time
import os

# Set set RQ_WORKER_CLASS=rq.worker.SimpleWorker before running rq_process
os.environ["RQ_WORKER_CLASS"] = "rq.worker.SimpleWorker"
rq_process = subprocess.Popen(["rq", "worker", "default"])
time.sleep(1)

# Start FastAPI with Uvicorn
uvicorn_process = subprocess.Popen(["uvicorn", "app:app", "--reload", "--port", "8000"])

try:
    uvicorn_process.wait()
finally:
    rq_process.terminate()
