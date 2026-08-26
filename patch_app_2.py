import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix patient name
content = content.replace(
    "const [patientName, setPatientName] = useState('Paciente Anónimo');",
    ""
)
content = content.replace(
    "{patientName}",
    "{username || 'Paciente Anónimo'}"
)
content = content.replace(
    "patient_name: patientName || 'Paciente Anónimo',",
    "patient_name: username || 'Paciente Anónimo',"
)


# Fix language in Triage payload
content = content.replace(
    "body: JSON.stringify({ messages: chatMessages })",
    "body: JSON.stringify({ messages: chatMessages, language: language })"
)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
