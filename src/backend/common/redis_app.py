from typing import Literal

from rq import Queue
from redis import Redis
from common.configs import RedisConfig

redis_client = Redis(
    host=RedisConfig.REDIS_HOST,
    port=RedisConfig.REDIS_PORT,
    db=RedisConfig.REDIS_DB,
    decode_responses=True,
)


def get_queue(
    name: Literal["analysis", "sync", "proposal", "default"] = "default",
) -> Queue:
    return Queue(f"karela_{name}", connection=redis_client)
