"""Cliente de Cloudflare R2 (API S3) compartido por los routers."""
import os

import boto3
from botocore.config import Config


R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID')
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID')
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY')
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME', 'media-hub-docs')
s3_client = None


if (R2_ACCOUNT_ID and R2_ACCESS_KEY_ID):
    s3_client = boto3.client('s3', endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com', aws_access_key_id=R2_ACCESS_KEY_ID, aws_secret_access_key=R2_SECRET_ACCESS_KEY, config=Config(signature_version='s3v4'), region_name='auto')
