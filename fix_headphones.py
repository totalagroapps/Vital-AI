import os

file_path = 'frontend/src/views/DoctorOnboarding.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("HeadphonesIcon", "Headphones")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced HeadphonesIcon with Headphones")
