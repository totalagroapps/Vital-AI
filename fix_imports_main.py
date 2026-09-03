import os

file_path = 'backend/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("from fastapi import Form, UploadFile, File\n\n@app.post(\"/api/auth/register-doctor\")", "@app.post(\"/api/auth/register-doctor\")")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Cleaned up local import in main.py")
