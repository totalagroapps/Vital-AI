import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all occurrences of PatientProfile.id == int(patient_id) if patient_id.isdigit() else PatientProfile.user_id == patient_id
# We already did it for list_documents, let's just globally replace how patient_id is handled if we find patient_id.isdigit()

content = re.sub(
    r'(?m)^\s*# Check if patient exists\s*stmt = select\(models\.PatientProfile\)\.where\(models\.PatientProfile\.id == int\(patient_id\) if patient_id\.isdigit\(\) else models\.PatientProfile\.user_id == patient_id\)',
    '    actual_patient_id = current_user_id if patient_id in ("me", "mock_user") else patient_id\n    # Check if patient exists\n    stmt = select(models.PatientProfile).where(models.PatientProfile.id == int(actual_patient_id) if actual_patient_id.isdigit() else models.PatientProfile.user_id == actual_patient_id)',
    content
)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
