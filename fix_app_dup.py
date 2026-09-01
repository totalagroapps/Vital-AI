import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = "          <PatientHome \n          onLogout={handleLogout}\n          onNavigate="
repl = "          <PatientHome \n          onNavigate="

content = content.replace(target, repl)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed duplicated onLogout in App.jsx")
