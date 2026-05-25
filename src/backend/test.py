from common.redis_app import redis_client

conn_id = "515b536d-ab6f-4c9c-9e8e-caf2147d0aed"
set_id = f"doc_{conn_id}"
print(redis_client.scard(set_id))
