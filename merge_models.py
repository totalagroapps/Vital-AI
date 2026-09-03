import os
import re

file_path = 'backend/models.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace both classes
pattern = re.compile(r'class SpecialistProfile\(Base\):.*?updated_at = Column\(DateTime\(timezone=True\), server_default=func\.now\(\), onupdate=func\.now\(\)\)\n\nclass SpecialistProfile\(Base\):.*?\n    created_at = Column\(DateTime\(timezone=True\), server_default=func\.now\(\)\)\n', re.DOTALL)

replacement = """class SpecialistProfile(Base):
    \"\"\"
    Perfil público y profesional del médico especialista.
    \"\"\"
    __tablename__ = "specialist_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True) # refers to users.id
    full_name = Column(String)
    specialty = Column(String, index=True)
    license_number = Column(String, nullable=True)
    experience_years = Column(Integer, default=0)
    city = Column(String, nullable=True)
    location = Column(String, nullable=True)
    languages = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    verified = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    availability_schedule = Column(JSON, nullable=True)
    photo_url = Column(String, nullable=True)
    diploma_url = Column(String, nullable=True)
    profile_pic_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
"""

# wait, I should just search for all SpecialistProfile blocks and replace them.
# A simpler way is to split by `class SpecialistProfile(Base):` and replace the latter parts.
parts = content.split('class SpecialistProfile(Base):')
if len(parts) > 1:
    new_content = parts[0] + replacement
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Merged SpecialistProfile")
else:
    print("Not found")

