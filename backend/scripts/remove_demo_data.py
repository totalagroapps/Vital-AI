"""Elimina de una base de datos los datos de demostración (médicos y pacientes ficticios, citas de ejemplo).

Uso (desde backend/):
    python -m scripts.remove_demo_data            # solo informa de lo que borraría
    python -m scripts.remove_demo_data --apply    # borra

Qué se considera demostración:
  · médicos sembrados por seed_catalogs (correos *@mivor.ai con la contraseña marcador "demo_hashed_password")
  · médico demo doctor@mivor.ai / dr.mivor y sus pacientes "patient-*" sembrados por seed_demo_doctor
Las cuentas reales no se tocan. Haz una copia de seguridad antes de usar --apply.
"""
import asyncio
import sys

from sqlalchemy import delete, func, or_, select

import database
import models

DEMO_DOCTOR_EMAILS = ["dra.ruiz@mivor.ai", "dr.gomez@mivor.ai", "dr.torres@mivor.ai", "dra.fernandez@mivor.ai", "dr.lopez@mivor.ai"]
DEMO_PLACEHOLDER_PASSWORD = "demo_hashed_password"
SEEDED_DOCTOR_USERNAMES = ["doctor@mivor.ai", "dr.mivor"]


async def main(apply: bool):
    async with database.AsyncSessionLocal() as db:
        # --- localizar usuarios de demostración
        seeded_docs = (await db.execute(
            select(models.User).where(
                models.User.username.in_(DEMO_DOCTOR_EMAILS),
                models.User.hashed_password == DEMO_PLACEHOLDER_PASSWORD,
            )
        )).scalars().all()
        seeded_doctor_users = (await db.execute(
            select(models.User).where(models.User.username.in_(SEEDED_DOCTOR_USERNAMES))
        )).scalars().all()
        demo_patients = (await db.execute(
            select(models.User).where(models.User.username.like("patient-%"), models.User.id == models.User.username)
        )).scalars().all()

        users = {u.id: u for u in [*seeded_docs, *seeded_doctor_users, *demo_patients]}
        user_ids = list(users)
        usernames = [u.username for u in users.values()]
        if not user_ids:
            print("No se encontraron datos de demostración.")
            return

        dp_ids = [r for r in (await db.execute(select(models.DoctorProfile.id).where(models.DoctorProfile.user_id.in_(user_ids)))).scalars().all()]
        profile_ids = [r for r in (await db.execute(select(models.PatientProfile.id).where(models.PatientProfile.user_id.in_(user_ids)))).scalars().all()]

        async def count(model, cond):
            return (await db.scalar(select(func.count()).select_from(model).where(cond))) or 0

        real_bookings = 0
        if dp_ids:
            # citas reservadas por pacientes REALES con médicos de demostración
            real_bookings = await count(models.ScheduledAppointment,
                                        models.ScheduledAppointment.doctor_id.in_(dp_ids) & ~models.ScheduledAppointment.patient_id.in_(user_ids))

        plan = [
            ("Usuarios demo", len(user_ids)),
            ("Perfiles de médico (DoctorProfile)", len(dp_ids)),
            ("Perfiles de paciente", len(profile_ids)),
            ("Citas reservadas (ScheduledAppointment)", await count(models.ScheduledAppointment,
                or_(models.ScheduledAppointment.doctor_id.in_(dp_ids or [None]), models.ScheduledAppointment.patient_id.in_(user_ids)))),
            ("Citas de agenda demo (Appointment)", await count(models.Appointment,
                or_(models.Appointment.doctor_id.in_(user_ids + usernames), models.Appointment.patient_id.in_(user_ids + usernames)))),
        ]
        for name, n in plan:
            print(f"  {name}: {n}")
        if real_bookings:
            print(f"  ⚠ {real_bookings} cita(s) de pacientes reales con médicos de demostración: también se borrarán.")
        if not apply:
            print("\nSimulación: no se ha borrado nada. Ejecuta con --apply para borrar.")
            return

        # --- borrado (orden que respeta las claves foráneas)
        if dp_ids:
            await db.execute(delete(models.ScheduledAppointment).where(models.ScheduledAppointment.doctor_id.in_(dp_ids)))
            for child in (models.AvailabilitySchedule, models.AvailabilityException, models.DoctorLanguage,
                          models.DoctorInsuranceCompany, models.DoctorProfileSpecialty):
                await db.execute(delete(child).where(child.doctor_id.in_(dp_ids)))
        await db.execute(delete(models.ScheduledAppointment).where(models.ScheduledAppointment.patient_id.in_(user_ids)))
        await db.execute(delete(models.Appointment).where(or_(
            models.Appointment.doctor_id.in_(user_ids + usernames), models.Appointment.patient_id.in_(user_ids + usernames))))
        if profile_ids:
            await db.execute(delete(models.HealthEvent).where(models.HealthEvent.patient_id.in_(profile_ids)))
            await db.execute(delete(models.MedicalDocument).where(models.MedicalDocument.patient_id.in_(profile_ids)))
        session_ids = (await db.execute(select(models.ChatSession.id).where(models.ChatSession.user_id.in_(user_ids)))).scalars().all()
        if session_ids:
            await db.execute(delete(models.ChatMessage).where(models.ChatMessage.session_id.in_(session_ids)))
        for model in (models.ChatSession, models.TriageSession, models.MedicationLog, models.MedicationReminder,
                      models.PatientProfile, models.SpecialistProfile):
            if hasattr(model, "user_id"):
                await db.execute(delete(model).where(model.user_id.in_(user_ids)))
        doctor_ids = (await db.execute(select(models.Doctor.id).where(models.Doctor.user_id.in_(user_ids)))).scalars().all()
        if doctor_ids:
            for child in (models.DoctorSpecialty, models.DoctorEducation, models.DoctorMedia, models.MedicalVerification):
                await db.execute(delete(child).where(child.doctor_id.in_(doctor_ids)))
            await db.execute(delete(models.Doctor).where(models.Doctor.id.in_(doctor_ids)))
        if dp_ids:
            await db.execute(delete(models.DoctorProfile).where(models.DoctorProfile.id.in_(dp_ids)))
        await db.execute(delete(models.User).where(models.User.id.in_(user_ids)))
        await db.commit()
        print("\nDatos de demostración eliminados.")


if __name__ == "__main__":
    asyncio.run(main("--apply" in sys.argv))
