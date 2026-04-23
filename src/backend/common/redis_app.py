from typing import Literal

from rq import Queue
from redis import Redis
from common.configs import RedisConfig


from redis import Redis
from rq import Queue
from common.configs import RedisConfig

redis_client = Redis(
    host=RedisConfig.REDIS_HOST, port=RedisConfig.REDIS_PORT, db=RedisConfig.REDIS_DB
)

# Defined static queues
QUEUES = {
    "default": Queue("karela_default", connection=redis_client),
    "analysis": Queue("karela_analysis", connection=redis_client),
    "sync": Queue("karela_sync", connection=redis_client),
    "proposal": Queue("karela_proposal", connection=redis_client),
    "doc": Queue("karela_doc", connection=redis_client),
}

queue_types = list(QUEUES.keys())
