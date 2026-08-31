import os
import re

file_path = 'backend/models.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add JSON import if missing
if 'from sqlalchemy.dialects.postgresql import JSONB' not in content:
    content = content.replace(
        'from sqlalchemy.dialects.postgresql import UUID',
        'from sqlalchemy.dialects.postgresql import UUID, JSONB'
    )

new_models = '''
class HealthEventType(str, enum.Enum):
    triage = "triage"
    document = "document"
    medication = "medication"
    allergy = "allergy"
    note = "note"

class HealthEvent(Base):
    __tablename__ = "health_events"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patient_profiles.id"), index=True)
    type = Column(Enum(HealthEventType))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    payload = Column(JSONB, nullable=True) # Usamos JSONB para almacenar datos estructurados variables
    source_ref_id = Column(String, nullable=True) # ID de referencia (ej. el ID del triage o del documento)

    patient = relationship("PatientProfile", back_populates="health_events")
'''

# Add the new models at the end of the file
if 'class HealthEvent(Base):' not in content:
    content += new_models

# Add the relationship to PatientProfile
relationship_str = '    health_events = relationship("HealthEvent", back_populates="patient", cascade="all, delete-orphan")'
if 'health_events = relationship(' not in content:
    # Find the end of PatientProfile class and insert it
    content = content.replace(
        'medical_documents = relationship("MedicalDocument", back_populates="patient")',
        f'medical_documents = relationship("MedicalDocument", back_populates="patient")\n{relationship_str}'
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated backend/models.py")
