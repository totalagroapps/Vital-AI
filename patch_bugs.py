import os

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Add authHeaders to triage start
old_triage = "      const res = await fetch(${API_URL}/api/triage/start, { method: 'POST' });"
new_triage = "      const res = await fetch(${API_URL}/api/triage/start, { method: 'POST', headers: authHeaders });"
content = content.replace(old_triage, new_triage)

# Fix 2: Render MedicalSearchModal
modal_render = '''      <MedicalSearchModal 
        isOpen={showMedicalSearch} 
        onClose={() => setShowMedicalSearch(false)} 
        token={token} 
        apiUrl={API_URL} 
        userProfile={patientProfile} 
      />
    </div>
  );
}'''
content = content.replace("    </div>\n  );\n}", modal_render)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched bugs")
