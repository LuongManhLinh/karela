import io
from typing import Optional

from fastapi import UploadFile
from fastapi.responses import StreamingResponse
from minio.error import S3Error

from common.minio_app import minio_client
from common.configs import MinioConfig


BUCKET = MinioConfig.BUCKET_NAME


def upload_file(file: UploadFile, prefix: str) -> dict:
    """Upload a file to MinIO and return {filename, url}."""
    object_name = f"{prefix}/{file.filename}"
    file_data = file.file.read()
    file_size = len(file_data)
    extension = file.filename.split(".")[-1].lower()

    minio_client.put_object(
        bucket_name=BUCKET,
        object_name=object_name,
        data=io.BytesIO(file_data),
        length=file_size,
        content_type=file.content_type or "application/octet-stream",
    )

    return {
        "filename": file.filename,
        "extension": extension,
        "url": object_name,
    }


def download_file(
    object_name: str, streaming: bool = True
) -> StreamingResponse | bytes:
    """Download a file from MinIO and return it as a streaming response."""
    try:
        response = minio_client.get_object(BUCKET, object_name)
        filename = object_name.split("/")[-1]
        if streaming:
            return StreamingResponse(
                response,
                media_type="application/octet-stream",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'},
            )
        else:
            return response.read()
    except S3Error as e:
        raise FileNotFoundError(f"File not found: {object_name}") from e


def delete_file(object_name: str) -> None:
    """Delete a file from MinIO."""
    try:
        minio_client.remove_object(BUCKET, object_name)
    except S3Error as e:
        raise FileNotFoundError(f"File not found: {object_name}") from e
