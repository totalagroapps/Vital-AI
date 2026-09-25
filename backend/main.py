import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select, text

import database
import models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('media_v2')

@asynccontextmanager
async def lifespan(_app: FastAPI):
    await on_startup()
    yield


app = FastAPI(title='MIVOR.ai - Team API', version='2.0', lifespan=lifespan)


def _ensure_missing_columns(sync_conn):
    from sqlalchemy import inspect as sa_inspect
    inspector = sa_inspect(sync_conn)
    existing_tables = set(inspector.get_table_names())
    added = []
    for table in models.Base.metadata.sorted_tables:
        if table.name not in existing_tables:
            continue
        present = {c['name'] for c in inspector.get_columns(table.name)}
        for col in table.columns:
            if col.name in present or col.primary_key or not col.nullable:
                continue
            col_type = col.type.compile(dialect=sync_conn.dialect)
            sync_conn.execute(text(f'ALTER TABLE "{table.name}" ADD COLUMN "{col.name}" {col_type}'))
            added.append(f'{table.name}.{col.name}')
    return added


async def on_startup():
    try:
        async with database.engine.begin() as conn:
            await conn.run_sync(models.Base.metadata.create_all)
        logger.info("Base metadata and tables verified.")
    except Exception as e:
        logger.warning(f"Error initializing DB tables on startup: {e}")

    # create_all no añade columnas nuevas a tablas ya existentes: se completan aquí (idempotente).
    try:
        async with database.engine.begin() as conn:
            added = await conn.run_sync(_ensure_missing_columns)
        if added:
            logger.info(f"Added missing DB columns: {added}")
    except Exception as e:
        logger.warning(f"Error ensuring missing columns on startup: {e}")

    try:
        from scripts.seed_catalogs import seed_catalogs, demo_seed_enabled
        await seed_catalogs(seed_demo=demo_seed_enabled())
    except Exception as e:
        logger.warning(f"Error seeding catalogs on startup: {e}")

    # Gating del seed de demo: solo en desarrollo o con flag explícito ENABLE_DEMO_SEED=true (Punto 2 & Punto 8)
    env = os.environ.get("ENVIRONMENT", os.environ.get("RAILWAY_ENVIRONMENT", "development")).lower()
    enable_demo_seed = os.environ.get("ENABLE_DEMO_SEED", "false").lower() in ("true", "1")

    if env == "development" or enable_demo_seed:
        try:
            from scripts.seed_demo_doctor import seed_data
            async with database.AsyncSessionLocal() as session:
                check_doc = await session.execute(select(models.User).where(models.User.username == 'doctor@mivor.ai'))
                has_doc = check_doc.scalars().first() is not None

                appts_count = await session.scalar(select(func.count()).select_from(models.Appointment))

                patients_count = await session.scalar(select(func.count()).select_from(models.PatientProfile))

                logger.info(f"Startup DB state: doctor_exists={has_doc}, appointments={appts_count}, patient_profiles={patients_count}")

                if not has_doc or appts_count < 5 or patients_count < 15:
                    logger.info("Demo data missing or incomplete, seeding demo doctor, patients and calendar...")
                    await seed_data()
        except Exception as e:
            logger.warning(f"Error seeding demo data on startup: {e}")
    else:
        logger.info("Production environment: automatic demo seeding is disabled.")

@app.get('/health')
def health_check():
    return {'status': 'healthy'}


DEFAULT_APK_URL = "https://github.com/totalagroapps/Vital-AI/releases/download/latest/mivor-latest.apk"


@app.get('/api/version')
def get_version():
    return {
        "version": os.getenv("APP_LATEST_VERSION", "1.0.2"),
        "apkUrl": os.getenv("APP_APK_URL", DEFAULT_APK_URL),
        "notes": os.getenv("APP_UPDATE_NOTES", "Nueva versión con diseño optimizado 100dvh para móvil (sin scroll) y adecuación regulatoria."),
        "forceUpdate": os.getenv("APP_FORCE_UPDATE", "false").lower() in ("true", "1")
    }


DOWNLOADS_DIR = os.path.join(os.path.dirname(__file__), "downloads")
os.makedirs(DOWNLOADS_DIR, exist_ok=True)


@app.get('/download/{filename}')
async def download_apk_file(filename: str):
    # Prevención estricta de Path Traversal (Punto 1 Auditoría R3)
    clean_filename = os.path.basename(filename)
    if not clean_filename or clean_filename != filename or ".." in filename or "/" in filename or "\\" in filename or "\x00" in filename:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    downloads_real_dir = os.path.realpath(DOWNLOADS_DIR)
    resolved_path = os.path.realpath(os.path.join(downloads_real_dir, clean_filename))

    if not resolved_path.startswith(downloads_real_dir + os.path.sep):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    if os.path.isfile(resolved_path):
        return FileResponse(resolved_path, filename=clean_filename, media_type="application/vnd.android.package-archive")

    # El workflow build-apk publica el APK en GitHub Releases como mivor-latest.apk
    return RedirectResponse(url=os.getenv("APP_APK_URL", DEFAULT_APK_URL), status_code=302)


# Lista explícita de orígenes permitidos para CORS (Punto 10)
DEFAULT_ALLOWED_ORIGINS = [
    "https://vitalai.up.railway.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "capacitor://localhost",
    "https://localhost",
    "http://localhost"
]
origins_env = os.getenv("ALLOWED_ORIGINS")
allowed_origins = [o.strip() for o in origins_env.split(",") if o.strip()] if origins_env else DEFAULT_ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
    expose_headers=['*']
)


# --- ROUTERS ---
from routers.auth import router as auth_router
app.include_router(auth_router)
from routers.chat import router as chat_router
app.include_router(chat_router)
from routers.documents import router as documents_router
app.include_router(documents_router)
from routers.triage import router as triage_router
app.include_router(triage_router)
from routers.patient import router as patient_router
app.include_router(patient_router)
from routers.doctor import router as doctor_router
app.include_router(doctor_router)
from routers.medications import router as medications_router
app.include_router(medications_router)
from routers.medical import router as medical_router
app.include_router(medical_router)
from routers.doctor_profile import router as doctor_profile_router
app.include_router(doctor_profile_router, prefix="/api")
app.include_router(doctor_profile_router)
from routers.doctor_verification import router as doctor_verification_router
app.include_router(doctor_verification_router, prefix="/api")
app.include_router(doctor_verification_router)

# --- AVATARS & STATIC ASSETS ---
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(STATIC_DIR, "avatars"), exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# --- CITAS Y ESPECIALISTAS (FACUNDO MODULAR INTEGRATION) ---
from routers.catalogs import router as catalogs_router
app.include_router(catalogs_router)
from routers.availability import router as availability_router
app.include_router(availability_router)
from routers.appointments import router as appointments_router
app.include_router(appointments_router)
from routers.doctors import router as doctors_router
app.include_router(doctors_router)
from routers.health_places import router as health_places_router
app.include_router(health_places_router)

from routers.i18n import router as i18n_router
app.include_router(i18n_router)

from routers.clinical_calculators import router as clinical_calculators_router
app.include_router(clinical_calculators_router)

from routers.cognitive_games import router as cognitive_games_router
app.include_router(cognitive_games_router)

from routers.surveillance import router as surveillance_router
app.include_router(surveillance_router)

from routers.consensus import router as consensus_router
app.include_router(consensus_router)

from routers.caregiver import router as caregiver_router
app.include_router(caregiver_router)

from routers.scribe import router as scribe_router
app.include_router(scribe_router)
