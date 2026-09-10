"""
media_service.py — Servicio unificado de subida y gestión de archivos multimedia (Cloudinary / R2 S3)
"""

import os
import uuid
import logging
from typing import Optional, Dict, Any
from fastapi import UploadFile, HTTPException

logger = logging.getLogger(__name__)

# Cloudinary configuración condicional
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

has_cloudinary = bool(CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET)

if has_cloudinary:
    try:
        import cloudinary
        import cloudinary.uploader
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME,
            api_key=CLOUDINARY_API_KEY,
            api_secret=CLOUDINARY_API_SECRET,
            secure=True
        )
        logger.info("Cloudinary configurado exitosamente.")
    except Exception as e:
        logger.warning(f"Error configurando Cloudinary: {e}")
        has_cloudinary = False

# R2 / S3 configuración
R2_ACCESS_KEY_ID = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_ACCOUNT_ID = os.getenv("R2_ACCOUNT_ID")
R2_BUCKET_NAME = os.getenv("R2_BUCKET_NAME", "produccion-backups-2026")

s3_client = None
if R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY and R2_ACCOUNT_ID:
    try:
        import boto3
        endpoint_url = f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
        s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint_url,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            region_name="auto"
        )
        logger.info("Almacenamiento Cloudflare R2 / S3 configurado exitosamente.")
    except Exception as e:
        logger.warning(f"Error configurando cliente R2/S3: {e}")


class MediaService:
    @staticmethod
    async def upload_file(
        file: UploadFile,
        folder: str = "doctors",
        media_type: str = "document",
        resource_type: str = "auto"
    ) -> Dict[str, Any]:
        """
        Sube un archivo usando Cloudinary o R2/S3 como fallback.
        Retorna:
          {
            "file_url": str,
            "public_id": str,
            "file_name": str,
            "mime_type": str,
            "file_size": int,
            "storage_provider": "cloudinary" | "r2" | "local"
          }
        """
        file_bytes = await file.read()
        await file.seek(0)
        file_size = len(file_bytes)
        filename = file.filename or f"{uuid.uuid4()}.bin"
        mime_type = file.content_type or "application/octet-stream"

        # 1. Intentar Cloudinary si está configurado
        if has_cloudinary:
            try:
                import cloudinary.uploader
                upload_res = cloudinary.uploader.upload(
                    file.file,
                    folder=folder,
                    resource_type=resource_type
                )
                return {
                    "file_url": upload_res.get("secure_url"),
                    "public_id": upload_res.get("public_id"),
                    "file_name": filename,
                    "mime_type": mime_type,
                    "file_size": upload_res.get("bytes", file_size),
                    "storage_provider": "cloudinary"
                }
            except Exception as e:
                logger.warning(f"Fallo subida a Cloudinary, intentando fallback R2/S3: {e}")

        # 2. Intentar R2 / S3 si está configurado
        if s3_client:
            try:
                key = f"{folder}/{uuid.uuid4()}_{filename}"
                s3_client.put_object(
                    Bucket=R2_BUCKET_NAME,
                    Key=key,
                    Body=file_bytes,
                    ContentType=mime_type
                )
                # Formar URL o key
                file_url = f"https://{R2_BUCKET_NAME}.r2.cloudflarestorage.com/{key}"
                return {
                    "file_url": file_url,
                    "public_id": key,
                    "file_name": filename,
                    "mime_type": mime_type,
                    "file_size": file_size,
                    "storage_provider": "r2"
                }
            except Exception as e:
                logger.error(f"Fallo subida a R2/S3: {e}")

        # 3. Fallback a almacenamiento local / mock seguro
        downloads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "downloads", folder)
        os.makedirs(downloads_dir, exist_ok=True)
        local_filename = f"{uuid.uuid4()}_{filename}"
        local_path = os.path.join(downloads_dir, local_filename)
        with open(local_path, "wb") as f:
            f.write(file_bytes)

        return {
            "file_url": f"/download/{folder}/{local_filename}",
            "public_id": local_filename,
            "file_name": filename,
            "mime_type": mime_type,
            "file_size": file_size,
            "storage_provider": "local"
        }

    @staticmethod
    def delete_file(public_id_or_url: str, storage_provider: str = "cloudinary") -> bool:
        if not public_id_or_url:
            return False
        if storage_provider == "cloudinary" and has_cloudinary:
            try:
                import cloudinary.uploader
                res = cloudinary.uploader.destroy(public_id_or_url)
                return res.get("result") == "ok"
            except Exception as e:
                logger.error(f"Error eliminando de Cloudinary: {e}")
                return False
        elif storage_provider == "r2" and s3_client:
            try:
                s3_client.delete_object(Bucket=R2_BUCKET_NAME, Key=public_id_or_url)
                return True
            except Exception as e:
                logger.error(f"Error eliminando de R2: {e}")
                return False
        return True


media_service = MediaService()
