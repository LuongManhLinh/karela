from rq import Queue
from redis import Redis
from common.configs import RedisConfig

redis_client = Redis(
    host=RedisConfig.REDIS_HOST,
    port=RedisConfig.REDIS_PORT,
    db=RedisConfig.REDIS_DB,
    decode_responses=True,
)

task_queue = Queue("karela", connection=redis_client)
