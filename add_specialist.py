import os
import re

file_path = 'backend/models.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_model = '''
class SpecialistProfile(Base):
    """
    Perfil pblico y profesional del mdico especialista.
    """
    __tablename__ = "specialist_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True) # refers to users.id
    full_name = Column(String)
    specialty = Column(String, index=True)
    city = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    availability_schedule = Column(JSON, nullable=True)
    photo_url = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
'''

if 'class SpecialistProfile' not in content:
    content += new_model
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added SpecialistProfile to models.py")
