import os
import re

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = "<PatientHomeDesktop onNavigate={onNavigate} />"
repl = "<PatientHomeDesktop onNavigate={onNavigate} onLogout={onLogout} />"

content = content.replace(target, repl)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added onLogout to PatientHome.jsx")
