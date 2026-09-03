import os

file_path = 'frontend/src/views/DoctorOnboarding.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('bg-gray-50/30', 'bg-gray-50')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed wizard background")
