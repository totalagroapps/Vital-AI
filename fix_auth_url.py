import os

file_path = 'frontend/src/Auth.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const endpoint = isRegistering ? '/api/register' : '/api/login';", "const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
