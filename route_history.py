import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import MedicalHistory
if 'import MedicalHistory' not in content:
    content = content.replace("import PatientChat from './views/PatientChat';", "import PatientChat from './views/PatientChat';\nimport MedicalHistory from './views/MedicalHistory';")

# 2. Add MedicalHistory early return
history_logic = '''  if (patientScreen === 'history') {
    return (
      <MedicalHistory 
        patientProfile={patientProfile}
        setPatientProfile={setPatientProfile}
        savePatientProfile={savePatientProfile}
        sessions={sessions}
        onBack={() => setPatientScreen('home')}
      />
    );
  }

  if (patientScreen === 'home') {'''
content = content.replace("  if (patientScreen === 'home') {", history_logic)

# 3. Clean up the renderModals references
content = re.sub(r"\s*\{renderModals\(\)\}", "", content)

# 4. Remove the definition of renderModals
content = re.sub(r"\s*const renderModals = \(\) => \{\s*return null;\s*// For now, we will just return null to stop the crashing\.\s*// We will extract the full modal safely next\.\s*\};\s*", "", content)

# 5. Fix BottomNav routing to go to 'history' instead of showing old modal
content = content.replace("setPatientScreen('chat');\n            fetchPatientProfile();\n            setShowMedicalHistory(true);", "setPatientScreen('history');\n            fetchPatientProfile();")

# 6. Fix PatientHome routing to go to 'history' instead of chat
content = content.replace("setPatientScreen('chat');\n                fetchPatientProfile();\n                setShowMedicalHistory(true);", "setPatientScreen('history');\n                fetchPatientProfile();")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App patched with full-screen Medical History!")
