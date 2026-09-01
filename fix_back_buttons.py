import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("setPatientScreen('home')", "navigate('/paciente')")
content = content.replace("handleNavigate('home')", "navigate('/paciente')")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed onBack buttons in App.jsx")
