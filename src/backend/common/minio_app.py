from minio import Minio
from common.configs import MinioConfig

minio_client = Minio(
    endpoint=MinioConfig.ENDPOINT,
    access_key=MinioConfig.ACCESS_KEY,
    secret_key=MinioConfig.SECRET_KEY,
    secure=MinioConfig.SECURE,
)

# Ensure the bucket exists on import
if not minio_client.bucket_exists(MinioConfig.BUCKET_NAME):
    minio_client.make_bucket(MinioConfig.BUCKET_NAME)
