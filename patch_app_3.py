import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "onChange={(e) => setPatientName(e.target.value)}",
    "readOnly"
)
content = content.replace(
    "downloadReport(msg.text, patientName, sessionTitle);",
    "downloadReport(msg.text, username || 'Paciente', sessionTitle);"
)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
