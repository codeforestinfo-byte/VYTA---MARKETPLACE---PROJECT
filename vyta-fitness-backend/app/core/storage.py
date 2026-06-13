from io import BytesIO
from typing import Optional

from minio import Minio
from minio.error import S3Error

from app.core.config import settings


class StorageService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        self.bucket = settings.MINIO_BUCKET

    async def ensure_bucket(self):
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)

    async def upload(self, object_name: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        self.client.put_object(
            self.bucket,
            object_name,
            BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
        return f"/uploads/{object_name}"

    async def get_url(self, object_name: str) -> Optional[str]:
        try:
            self.client.stat_object(self.bucket, object_name)
            return f"/uploads/{object_name}"
        except S3Error:
            return None

    async def delete(self, object_name: str):
        try:
            self.client.remove_object(self.bucket, object_name)
        except S3Error:
            pass

    def get_file(self, object_name: str) -> Optional[bytes]:
        try:
            response = self.client.get_object(self.bucket, object_name)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except S3Error:
            return None


storage = StorageService()
