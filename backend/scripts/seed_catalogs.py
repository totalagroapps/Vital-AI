import asyncio
import datetime
import logging
import uuid
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlalchemy import select, func
import database
import models

logger = logging.getLogger("seed_catalogs")

SPECIALTIES = [
    "Allergology",
    "Anesthesiology and Resuscitation",
    "Gastroenterology",
    "Cardiology",
    "Endocrinology and Nutrition",
    "Clinical Pharmacology",
    "Geriatrics",
    "Hematology and Hemotherapy",
    "Immunology",
    "Family and Community Medicine",
    "Physical Medicine and Rehabilitation",
    "Intensive Care Medicine",
    "Internal Medicine",
    "Legal and Forensic Medicine",
    "Nuclear Medicine",
    "Preventive Medicine and Public Health",
    "Occupational Medicine",
    "Microbiology and Parasitology",
    "Nephrology",
    "Pulmonology",
    "Neurology",
    "Clinical Neurophysiology",
    "Medical Oncology",
    "Radiation Oncology",
    "Psychiatry",
    "Child and Adolescent Psychiatry",
    "Rheumatology",
    "Diagnostic Radiology",
    "Clinical Laboratory",
    "Pathology",
    "Emergency Medicine",
    "Angiology and Vascular Surgery",
    "Cardiovascular Surgery",
    "General and Digestive Surgery",
    "Oral and Maxillofacial Surgery",
    "Orthopedic Surgery and Traumatology",
    "Pediatric Surgery",
    "Plastic, Aesthetic and Reconstructive Surgery",
    "Thoracic Surgery",
    "Dermatology and Venereology",
    "Obstetrics and Gynecology",
    "Ophthalmology",
    "Otorhinolaryngology",
    "Urology",
    "Pediatrics",
    "Neurosurgery",
]

LANGUAGES = [
    ("es", "Spanish"),
    ("en", "English"),
    ("fr", "French"),
    ("de", "German"),
    ("it", "Italian"),
    ("pt", "Portuguese"),
    ("ca", "Catalan"),
    ("ar", "Arabic"),
    ("zh", "Chinese"),
    ("ru", "Russian"),
    ("ja", "Japanese"),
    ("ko", "Korean"),
]

INSURERS = [
    "Sanitas",
    "Adeslas",
    "Asisa",
    "DKV Seguros",
    "Mapfre",
    "Caser Seguros",
    "AXA Salud",
    "FIATC",
]

DEMO_DOCTORS = [
    {
        "full_name": "Dra. Elena Ruiz",
        "specialty": "Neurology",
        "modality": models.Modality.both,
        "rating": 4.9,
        "address": "Calle Larios 12, 29005 Málaga",
        "lat": 36.72016,
        "lng": -4.4214,
        "phone": "+34 952 10 20 30",
        "email": "dra.ruiz@mivor.ai",
        "clinic_name": "Clínica Neurológica Miramar",
        "years_experience": 14,
        "education": "Especialista en Neurología Clínica, Hospital Carlos Haya",
        "languages": ["es", "en"],
        "insurers": ["Sanitas", "Adeslas"],
        "schedules": [
            (0, datetime.time(9, 0), datetime.time(13, 0), models.Modality.video),
            (1, datetime.time(9, 0), datetime.time(13, 0), models.Modality.video),
            (2, datetime.time(9, 0), datetime.time(13, 0), models.Modality.video),
            (3, datetime.time(9, 0), datetime.time(13, 0), models.Modality.video),
            (4, datetime.time(9, 0), datetime.time(13, 0), models.Modality.video),
            (0, datetime.time(16, 0), datetime.time(19, 0), models.Modality.in_person),
            (2, datetime.time(16, 0), datetime.time(19, 0), models.Modality.in_person),
        ],
    },
    {
        "full_name": "Dr. Marcos Gómez",
        "specialty": "Cardiology",
        "modality": models.Modality.video,
        "rating": 4.8,
        "address": "Paseo de la Farola 8, 29016 Málaga",
        "lat": 36.7175,
        "lng": -4.4132,
        "phone": "+34 952 11 22 33",
        "email": "dr.gomez@mivor.ai",
        "clinic_name": "Cardiocentro Costa del Sol",
        "years_experience": 18,
        "education": "Cardiología Intervencionista, Univ. de Navarra",
        "languages": ["es", "en", "fr"],
        "insurers": ["Adeslas", "Asisa", "DKV Seguros"],
        "schedules": [
            (0, datetime.time(10, 0), datetime.time(14, 0), models.Modality.video),
            (1, datetime.time(10, 0), datetime.time(14, 0), models.Modality.video),
            (2, datetime.time(10, 0), datetime.time(14, 0), models.Modality.video),
            (3, datetime.time(10, 0), datetime.time(14, 0), models.Modality.video),
            (1, datetime.time(17, 0), datetime.time(20, 0), models.Modality.video),
            (3, datetime.time(17, 0), datetime.time(20, 0), models.Modality.video),
        ],
    },
    {
        "full_name": "Dr. Javier Torres",
        "specialty": "Internal Medicine",
        "modality": models.Modality.both,
        "rating": 4.7,
        "address": "Av. Condes de San Isidro 45, 29640 Fuengirola",
        "lat": 36.5412,
        "lng": -4.6248,
        "phone": "+34 951 88 99 00",
        "email": "dr.torres@mivor.ai",
        "clinic_name": "Centro Médico Los Boliches",
        "years_experience": 11,
        "education": "Medicina Interna, Hospital Virgen de la Victoria",
        "languages": ["es", "en", "de"],
        "insurers": ["Sanitas", "Mapfre"],
        "schedules": [
            (0, datetime.time(8, 0), datetime.time(12, 0), models.Modality.both),
            (2, datetime.time(8, 0), datetime.time(12, 0), models.Modality.both),
            (4, datetime.time(8, 0), datetime.time(12, 0), models.Modality.both),
        ],
    },
    {
        "full_name": "Dra. Laura Fernández",
        "specialty": "Dermatology and Venereology",
        "modality": models.Modality.in_person,
        "rating": 5.0,
        "address": "Calle Marbella 14, 29640 Fuengirola",
        "lat": 36.5398,
        "lng": -4.6231,
        "phone": "+34 951 77 66 55",
        "email": "dra.fernandez@mivor.ai",
        "clinic_name": "Dermaclinic Fuengirola",
        "years_experience": 9,
        "education": "Dermatología Estética y Clínica, Univ. Complutense",
        "languages": ["es", "en"],
        "insurers": ["Sanitas", "Adeslas", "Caser Seguros"],
        "schedules": [
            (1, datetime.time(15, 0), datetime.time(19, 0), models.Modality.in_person),
            (2, datetime.time(15, 0), datetime.time(19, 0), models.Modality.in_person),
            (3, datetime.time(15, 0), datetime.time(19, 0), models.Modality.in_person),
            (4, datetime.time(15, 0), datetime.time(19, 0), models.Modality.in_person),
            (5, datetime.time(15, 0), datetime.time(19, 0), models.Modality.in_person),
        ],
    },
    {
        "full_name": "Dr. Javier López",
        "specialty": "Orthopedic Surgery and Traumatology",
        "modality": models.Modality.in_person,
        "rating": 4.9,
        "address": "Av. Ramón y Cajal 22, 29640 Fuengirola",
        "lat": 36.5435,
        "lng": -4.6210,
        "phone": "+34 951 22 33 44",
        "email": "dr.lopez@mivor.ai",
        "clinic_name": "Instituto Traumatológico Costa del Sol",
        "years_experience": 16,
        "education": "Cirugía Ortopédica, Univ. Autónoma de Barcelona",
        "languages": ["es", "en"],
        "insurers": ["Sanitas", "Adeslas", "Mapfre", "AXA Salud"],
        "schedules": [
            (0, datetime.time(10, 0), datetime.time(13, 0), models.Modality.in_person),
            (1, datetime.time(10, 0), datetime.time(13, 0), models.Modality.in_person),
            (3, datetime.time(10, 0), datetime.time(13, 0), models.Modality.in_person),
            (4, datetime.time(10, 0), datetime.time(13, 0), models.Modality.in_person),
        ],
    },
]


async def seed_catalogs():
    async with database.AsyncSessionLocal() as db:
        # 1. Specialties
        for spec_name in SPECIALTIES:
            exist = await db.scalar(
                select(models.Specialty).where(func.lower(models.Specialty.name) == spec_name.lower())
            )
            if not exist:
                db.add(models.Specialty(name=spec_name, is_active=True))

        # 2. Languages
        for code, lang_name in LANGUAGES:
            exist = await db.scalar(
                select(models.Language).where(models.Language.code == code)
            )
            if not exist:
                db.add(models.Language(code=code, name=lang_name))

        # 3. Insurers
        for ins_name in INSURERS:
            exist = await db.scalar(
                select(models.InsuranceCompany).where(func.lower(models.InsuranceCompany.name) == ins_name.lower())
            )
            if not exist:
                db.add(models.InsuranceCompany(name=ins_name))

        await db.flush()

        # 4. Demo Doctors Profiles
        existing_doc_count = await db.scalar(select(func.count(models.DoctorProfile.id)))
        if not existing_doc_count:
            logger.info("Seeding demo specialist doctor profiles...")
            for d in DEMO_DOCTORS:
                # Get or create user for this doctor
                user = await db.scalar(select(models.User).where(models.User.username == d["email"]))
                if not user:
                    user = models.User(
                        id=str(uuid.uuid4()),
                        username=d["email"],
                        hashed_password="demo_hashed_password",
                        role="doctor",
                    )
                    db.add(user)
                    await db.flush()

                doc_profile = models.DoctorProfile(
                    user_id=user.id,
                    full_name=d["full_name"],
                    modality=d["modality"],
                    rating=d["rating"],
                    address=d["address"],
                    lat=d["lat"],
                    lng=d["lng"],
                    phone=d["phone"],
                    email=d["email"],
                    clinic_name=d["clinic_name"],
                    years_experience=d["years_experience"],
                    education=d["education"],
                    timezone="Europe/Madrid",
                    appointment_duration_minutes=30,
                    appointment_buffer_minutes=5,
                )
                db.add(doc_profile)
                await db.flush()

                # Specialty association
                spec = await db.scalar(select(models.Specialty).where(models.Specialty.name == d["specialty"]))
                if spec:
                    db.add(models.DoctorProfileSpecialty(doctor_id=doc_profile.id, specialty_id=spec.id))

                # Language associations
                for lcode in d["languages"]:
                    lang = await db.scalar(select(models.Language).where(models.Language.code == lcode))
                    if lang:
                        db.add(models.DoctorLanguage(doctor_id=doc_profile.id, language_id=lang.id))

                # Insurer associations
                for iname in d["insurers"]:
                    ins = await db.scalar(select(models.InsuranceCompany).where(models.InsuranceCompany.name == iname))
                    if ins:
                        db.add(models.DoctorInsuranceCompany(doctor_id=doc_profile.id, insurance_company_id=ins.id))

                # Availability schedules
                for weekday, stime, etime, smodality in d["schedules"]:
                    sched = models.AvailabilitySchedule(
                        doctor_id=doc_profile.id,
                        weekday=weekday,
                        start_time=stime,
                        end_time=etime,
                        modality=smodality,
                    )
                    db.add(sched)

        await db.commit()
        logger.info("Catalogs and demo specialist profiles verified.")


if __name__ == "__main__":
    asyncio.run(seed_catalogs())
