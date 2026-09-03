import os
import re

file_path = 'frontend/src/views/MedicalHistory.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("session.title", "(session.payload?.title || session.title || 'Consulta de Triage')")
content = content.replace("session.severity", "(session.payload?.severity || session.severity)")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated MedicalHistory.jsx payload mapping")
