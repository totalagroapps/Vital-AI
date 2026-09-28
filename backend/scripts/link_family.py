import sys
import asyncio
from sqlalchemy import select
from database import AsyncSessionLocal
import models

async def link_accounts(caregiver_username, patient_username, relationship):
    async with AsyncSessionLocal() as db:
        # Find Caregiver
        cg = await db.execute(select(models.User).where(models.User.username == caregiver_username))
        cg = cg.scalars().first()
        if not cg:
            print(f"Error: No se encontró al cuidador '{caregiver_username}'")
            return

        # Find Patient
        pt = await db.execute(select(models.User).where(models.User.username == patient_username))
        pt = pt.scalars().first()
        if not pt:
            print(f"Error: No se encontró al paciente '{patient_username}'")
            return

        # Check if already linked
        existing = await db.execute(
            select(models.CaregiverPatientLink).where(
                models.CaregiverPatientLink.caregiver_id == cg.id,
                models.CaregiverPatientLink.patient_id == pt.id
            )
        )
        if existing.scalars().first():
            print("El vínculo ya existe.")
            return

        # Create Link
        link = models.CaregiverPatientLink(
            caregiver_id=cg.id,
            patient_id=pt.id,
            relationship=relationship
        )
        db.add(link)
        await db.commit()
        print(f"✅ ¡Éxito! '{caregiver_username}' ahora es administrador de '{patient_username}' ({relationship}).")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Uso: python link_family.py <email_hijo> <email_padre> <parentesco>")
        sys.exit(1)
    
    asyncio.run(link_accounts(sys.argv[1], sys.argv[2], sys.argv[3]))
