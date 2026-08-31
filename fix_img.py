import os

file_path = 'frontend/src/views/DoctorHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("ai_doctor_profile_1787938866372.jpg", "ai_doctor_bg.jpg")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
