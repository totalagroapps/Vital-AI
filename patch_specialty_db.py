import os

with open('backend/models.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Add recommended_specialty to TriageSession
if 'recommended_specialty' not in content:
    content = content.replace("final_report = Column(Text, nullable=True)", "final_report = Column(Text, nullable=True)\n    recommended_specialty = Column(String, nullable=True)")

with open('backend/models.py', 'w', encoding='utf-8') as f:
    f.write(content)

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content2 = f.read()

if 'triage_sessions ADD COLUMN IF NOT EXISTS recommended_specialty' not in content2:
    alter = '            await conn.execute(text("ALTER TABLE triage_sessions ADD COLUMN IF NOT EXISTS recommended_specialty VARCHAR;"))\n'
    content2 = content2.replace('await conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS weight VARCHAR;"))', 'await conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS weight VARCHAR;"))\n' + alter)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content2)

print("Updated models and startup with recommended_specialty")
