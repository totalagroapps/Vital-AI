import os
import re

file_path = 'backend/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_specialists = '''
# 6. Endpoint: Directorio de Especialistas
@app.get("/api/specialists")
async def get_specialists(
    specialty: str = None,
    city: str = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Recupera la lista de especialistas mdicos, opcionalmente filtrando por especialidad o ciudad.
    """
    stmt = select(models.SpecialistProfile)
    
    if specialty:
        stmt = stmt.where(models.SpecialistProfile.specialty.ilike(f"%{specialty}%"))
    if city:
        stmt = stmt.where(models.SpecialistProfile.city.ilike(f"%{city}%"))
        
    result = await db.execute(stmt)
    specialists = result.scalars().all()
    
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "full_name": s.full_name,
            "specialty": s.specialty,
            "city": s.city,
            "verified": s.verified,
            "photo_url": s.photo_url,
            "availability_schedule": s.availability_schedule or {}
        }
        for s in specialists
    ]
'''

if '@app.get("/api/specialists")' not in content:
    content += new_specialists
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added /api/specialists")
