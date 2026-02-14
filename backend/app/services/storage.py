"""
Cloudflare R2 storage service (S3-compatible).

Handles image optimization (PNG → WebP) and upload to R2.
Falls back gracefully when R2 is not configured.
"""

import io
import logging

import boto3
from PIL import Image
from botocore.config import Config

from app.config import settings

logger = logging.getLogger(__name__)


class R2Storage:
    """Cloudflare R2 storage service."""

    def __init__(self):
        self._client = None
        self.bucket = settings.R2_BUCKET_NAME
        self.public_url = (settings.R2_PUBLIC_URL or "").rstrip("/")
        self._enabled = bool(
            settings.R2_ENDPOINT_URL
            and settings.R2_ACCESS_KEY_ID
            and settings.R2_SECRET_ACCESS_KEY
            and settings.R2_PUBLIC_URL
        )

    @property
    def enabled(self) -> bool:
        return self._enabled

    @property
    def client(self):
        if self._client is None:
            self._client = boto3.client(
                "s3",
                endpoint_url=settings.R2_ENDPOINT_URL,
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=Config(
                    signature_version="s3v4",
                    retries={"max_attempts": 3, "mode": "adaptive"},
                ),
                region_name="auto",
            )
        return self._client

    def optimize_image(
        self,
        image_bytes: bytes,
        max_width: int = 1200,
        max_height: int = 900,
        quality: int = 82,
    ) -> bytes:
        """Optimize image: resize and convert to WebP."""
        img = Image.open(io.BytesIO(image_bytes))

        if img.mode == "RGBA":
            background = Image.new("RGB", img.size, (0, 0, 0))
            background.paste(img, mask=img.split()[3])
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        img.thumbnail((max_width, max_height), Image.LANCZOS)

        buffer = io.BytesIO()
        img.save(buffer, format="WEBP", quality=quality, method=4)
        buffer.seek(0)
        return buffer.read()

    async def upload_image(
        self,
        image_bytes: bytes,
        key: str,
        content_type: str = "image/webp",
        max_width: int = 1200,
        max_height: int = 900,
        quality: int = 82,
    ) -> str:
        """
        Optimize and upload image to R2.

        Converts PNG/JPEG → WebP, resizes, compresses.
        Returns public URL.
        """
        try:
            optimized = self.optimize_image(image_bytes, max_width, max_height, quality)

            # Ensure .webp extension
            for ext in (".png", ".jpg", ".jpeg"):
                if key.endswith(ext):
                    key = key.rsplit(".", 1)[0] + ".webp"
                    break

            logger.info(
                "Image optimized: %d -> %d bytes (%.0f%%), key=%s",
                len(image_bytes),
                len(optimized),
                len(optimized) / len(image_bytes) * 100,
                key,
            )

            self.client.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=optimized,
                ContentType=content_type,
                CacheControl="public, max-age=31536000, immutable",
            )

            public_url = f"{self.public_url}/{key}"
            logger.info("Uploaded to R2: %s", public_url)
            return public_url

        except Exception as e:
            logger.error("R2 upload failed for key=%s: %s", key, e)
            raise

    async def delete_folder(self, prefix: str):
        """Delete all objects with the given prefix."""
        try:
            response = self.client.list_objects_v2(
                Bucket=self.bucket, Prefix=prefix
            )
            if "Contents" in response:
                objects = [{"Key": obj["Key"]} for obj in response["Contents"]]
                self.client.delete_objects(
                    Bucket=self.bucket, Delete={"Objects": objects}
                )
                logger.info("Deleted %d objects with prefix %s", len(objects), prefix)
        except Exception as e:
            logger.error("R2 delete failed for prefix=%s: %s", prefix, e)


storage = R2Storage()
