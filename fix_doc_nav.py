import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "setPatientScreen('chat');" in line and "redirigido" in lines[i-1]:
        lines[i] = "          startTriageSession();\n          navigate('/paciente/asistente');"

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print("Patched DocumentAnalyzer navigate")
