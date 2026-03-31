import subprocess
import time
import os
from common.redis_app import queue_types
from common.configs import ServerConfig

# Set set RQ_WORKER_CLASS=rq.worker.SimpleWorker before running rq_process
os.environ["RQ_WORKER_CLASS"] = "rq.worker.SimpleWorker"

# Start workers for each queue type
processes = []
for queue_type in queue_types:
    print(f"Starting worker for queue: {queue_type}")
    for _ in range(ServerConfig.WORKER_PER_QUEUE):
        p = subprocess.Popen(["rq", "worker", f"karela_{queue_type}"])
        processes.append(p)
        time.sleep(0.1)  # Stagger worker startups

uvicorn_process = subprocess.Popen(["uvicorn", "app:app", "--port", ServerConfig.PORT])

try:
    uvicorn_process.wait()
finally:
    print("Shutting down workers...")
    for p in processes:
        p.terminate()
    uvicorn_process.terminate()
