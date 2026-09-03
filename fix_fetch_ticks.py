import os

file_path = 'frontend/src/views/DoctorOnboarding.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const res = await fetch(${API_URL}/api/auth/register-doctor, {', 'const res = await fetch(`${API_URL}/api/auth/register-doctor`, {')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed backticks")
