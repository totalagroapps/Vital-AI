import os

file_path = 'backend/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_history_route = '''
@app.get("/api/patients/{patient_id}/history")
async def get_patient_history(
    patient_id: str, 
    db: AsyncSession = Depends(get_db), 
    current_user_id: str = Depends(get_current_user_id)
):
    actual_patient_id = current_user_id if patient_id == "me" or patient_id == "mock_user" else patient_id
    
    stmt = select(models.PatientProfile).where(
        models.PatientProfile.id == int(actual_patient_id) if actual_patient_id.isdigit() else models.PatientProfile.user_id == actual_patient_id
    )
    result = await db.execute(stmt)
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
        
    events_stmt = select(models.HealthEvent).where(
        models.HealthEvent.patient_id == patient.id
    ).order_by(models.HealthEvent.created_at.desc())
    
    events_result = await db.execute(events_stmt)
    events = events_result.scalars().all()
    
    response = []
    for event in events:
        response.append({
            "id": event.id,
            "type": event.type.value,
            "created_at": event.created_at.isoformat() if event.created_at else None,
            "payload": event.payload or {},
            "source_ref_id": event.source_ref_id
        })
        
    return response
'''

if '@app.get("/api/patients/{patient_id}/history")' not in content:
    content += new_history_route
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added history endpoint to main.py")
