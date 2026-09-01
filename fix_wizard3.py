import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'setPatientScreen\(\'chat\'\);(.*?)startTriageSession\(\);'
repl = r"navigate('/paciente/asistente');\n            setInputMessage(symptoms);\n            startTriageSession();"

content = re.sub(pattern, repl, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Regex replace executed")
