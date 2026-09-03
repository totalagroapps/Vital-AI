import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const response = await fetch(${API_URL}/api/chat/general", 
    "const response = await fetch(`${API_URL}/api/chat/general`"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
