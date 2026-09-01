import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace using split and join to avoid line ending issues
lines = content.split('\n')
for i, line in enumerate(lines):
    if "setPatientScreen('chat');" in line and "In App.jsx, there's no setInputMessage out of the box because it's a controlled input" in lines[i+1]:
        lines[i] = "          navigate('/paciente/asistente');"
        lines[i+1] = "          setInputMessage(symptoms);"
        lines[i+2] = "          startTriageSession();"
        lines[i+3] = "        }} />"

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print("Patched App.jsx safely")
