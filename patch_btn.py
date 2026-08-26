import os

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_click = "onClick={() => setShowMedicalHistory(true)}"
new_click = "onClick={() => { fetchPatientProfile(); setShowMedicalHistory(true); }}"

content = content.replace(old_click, new_click)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated UI button")
