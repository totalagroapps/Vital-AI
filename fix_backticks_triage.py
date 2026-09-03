import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "const res = await fetch(${API_URL}/api/triage/start, { method: 'POST', headers: authHeaders });", 
    "const res = await fetch(`${API_URL}/api/triage/start`, { method: 'POST', headers: authHeaders });"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed backticks in App.jsx triage")
