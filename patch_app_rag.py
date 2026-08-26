import os
import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
if 'MedicalSearchModal' not in content:
    content = content.replace("import Auth from './Auth';", "import Auth from './Auth';\nimport MedicalSearchModal from './MedicalSearchModal';")

# 2. State
if 'showMedicalSearch' not in content:
    content = content.replace("const [showDocuments, setShowDocuments] = useState(false);", "const [showDocuments, setShowDocuments] = useState(false);\n  const [showMedicalSearch, setShowMedicalSearch] = useState(false);")

# 3. Render Modal
modal_render = '''      <MedicalSearchModal 
        isOpen={showMedicalSearch} 
        onClose={() => setShowMedicalSearch(false)} 
        token={token} 
        apiUrl={API_URL} 
        userProfile={patientProfile} 
      />'''

if 'isOpen={showMedicalSearch}' not in content:
    content = content.replace("{/* Modals */}", "{/* Modals */}\n" + modal_render)

# 4. Update Button Action
old_button = "alert('Funcionalidad RAG de consulta de artículos en desarrollo por tu compañera.');"
new_button = "setShowMedicalSearch(true);"
content = content.replace(old_button, new_button)
# Fallback if accent issue:
content = content.replace("alert('Funcionalidad RAG de consulta de artculos en desarrollo por tu compaera.');", new_button)
content = re.sub(r"alert\('Funcionalidad RAG.*?'\);", new_button, content)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Injected MedicalSearchModal into App.jsx")
