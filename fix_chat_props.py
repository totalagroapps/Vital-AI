import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("<PatientChat ", "<PatientChat \n          patientProfile={patientProfile}\n          sessions={sessions}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.jsx props")
