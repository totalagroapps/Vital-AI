import os

# Fix PatientHome
file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('opacity-80 mix-blend-screen', 'opacity-100')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Fix DoctorHome
file_path = 'frontend/src/views/DoctorHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace('opacity-60 mix-blend-multiply', 'opacity-100')
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed mix-blend modes!")
