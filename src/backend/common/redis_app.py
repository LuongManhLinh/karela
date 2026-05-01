from redis import Redis
from common.configs import RedisConfig


from redis import Redis
from common.configs import RedisConfig

redis_client = Redis(
    host=RedisConfig.REDIS_HOST, port=RedisConfig.REDIS_PORT, db=RedisConfig.REDIS_DB
)

queue_types = [
    "default",
    "analysis",
    "sync",
    "proposal",
    "doc",
]
