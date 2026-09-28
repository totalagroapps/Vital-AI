import os
import sys
import time
import subprocess
import logging
from datetime import datetime
from dotenv import load_dotenv
import boto3
from botocore.config import Config

# Configurar logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("backup_db")

# Cargar entorno (asegurar que estamos buscando en /backend/.env)
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_dir)
load_dotenv(os.path.join(backend_dir, ".env"))

R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME", "media-hub-docs")
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///../medai.db")

def upload_to_r2(file_path: str, object_key: str):
    if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY]):
        logger.warning("Credenciales de R2 no configuradas. Omitiendo subida a la nube.")
        return False
    
    s3_client = boto3.client(
        's3', 
        endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com', 
        aws_access_key_id=R2_ACCESS_KEY_ID, 
        aws_secret_access_key=R2_SECRET_ACCESS_KEY, 
        config=Config(signature_version='s3v4'), 
        region_name='auto'
    )
    
    logger.info(f"Subiendo {file_path} al bucket {R2_BUCKET_NAME} como {object_key}...")
    try:
        with open(file_path, "rb") as f:
            s3_client.put_object(Bucket=R2_BUCKET_NAME, Key=object_key, Body=f)
        logger.info("Subida a Cloudflare R2 completada exitosamente.")
        return True
    except Exception as e:
        logger.error(f"Fallo al subir a R2: {e}")
        return False

def main():
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    import tempfile
    
    if "postgres" in DATABASE_URL:
        # Respaldo Postgres
        logger.info("Base de datos PostgreSQL detectada. Ejecutando pg_dump...")
        backup_file = os.path.join(tempfile.gettempdir(), f"medai_backup_{timestamp}.sql")
        # Asegurar formato estándar de pg_dump (remover dialecto de asyncpg)
        dump_url = DATABASE_URL.replace("+asyncpg", "")
        
        try:
            subprocess.run(["pg_dump", dump_url, "-f", backup_file], check=True)
            logger.info("pg_dump completado.")
        except Exception as e:
            logger.error(f"pg_dump falló: {e}")
            sys.exit(1)
            
    else:
        # Respaldo SQLite
        logger.info("Base de datos SQLite detectada.")
        db_path = os.path.join(backend_dir, "medai.db")
        if not os.path.exists(db_path):
            logger.error(f"Base de datos SQLite no encontrada en {db_path}")
            sys.exit(1)
            
        backup_file = os.path.join(tempfile.gettempdir(), f"medai_backup_{timestamp}.db")
        try:
            # Hacer un volcado seguro para no corromper en caso de transacciones activas
            import sqlite3
            conn = sqlite3.connect(db_path)
            conn.execute(f"VACUUM INTO '{backup_file}'")
            conn.close()
            logger.info("Copia de seguridad de SQLite generada.")
        except Exception as e:
            logger.error(f"Fallo al respaldar SQLite: {e}")
            sys.exit(1)

    # Comprimir el archivo
    import zipfile
    zip_path = f"{backup_file}.zip"
    logger.info(f"Comprimiendo respaldo en {zip_path}...")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(backup_file, arcname=os.path.basename(backup_file))
    
    # Subir a la nube R2
    object_key = f"backups/db/medai_backup_{timestamp}.zip"
    upload_to_r2(zip_path, object_key)
    
    # Limpieza
    try:
        os.remove(backup_file)
        os.remove(zip_path)
        logger.info("Archivos temporales locales limpiados.")
    except Exception as e:
        logger.warning(f"No se pudieron limpiar archivos temporales: {e}")

if __name__ == "__main__":
    main()
