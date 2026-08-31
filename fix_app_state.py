import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = "const [viewMode, setViewMode] = useState(localStorage.getItem('med_role') || 'patient');"
repl = "const [viewMode, setViewMode] = useState(localStorage.getItem('med_role') || 'patient');\n  const [showDoctorOnboarding, setShowDoctorOnboarding] = useState(false);"

content = content.replace(target, repl)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added showDoctorOnboarding to App.jsx")
