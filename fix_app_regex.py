import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Find <PatientHome and replace the first onLogout={handleLogout}
# Wait, just find the whole PatientHome block using regex and remove one of them.
pattern = r'(<PatientHome\s*onLogout=\{handleLogout\}\s*onNavigate=\{.*?\}\s*)onLogout=\{handleLogout\}\s*(/>)'
content = re.sub(pattern, r'\1\2', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Regex replace done")
