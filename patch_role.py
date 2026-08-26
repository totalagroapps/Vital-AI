import os
import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update useState
content = content.replace("const [viewMode, setViewMode] = useState('patient');", "const [viewMode, setViewMode] = useState(localStorage.getItem('med_role') || 'patient');")

# 2. Update onLogin handler
old_auth = "return <Auth onLogin={(jwt, role) => { setToken(jwt); localStorage.setItem('med_token', jwt); if(role) setViewMode(role); }} apiUrl={API_URL} />;"
new_auth = "return <Auth onLogin={(jwt, role) => { setToken(jwt); localStorage.setItem('med_token', jwt); if(role) { setViewMode(role); localStorage.setItem('med_role', role); } }} apiUrl={API_URL} />;"
content = content.replace(old_auth, new_auth)

# 3. Update onLogout for doctor
old_doc_logout = "return <DoctorDashboard apiUrl={API_URL} authHeaders={authHeaders} onLogout={() => {setToken(null); localStorage.removeItem('med_token'); setViewMode('patient');}} />;"
new_doc_logout = "return <DoctorDashboard apiUrl={API_URL} authHeaders={authHeaders} onLogout={() => {setToken(null); localStorage.removeItem('med_token'); localStorage.removeItem('med_role'); setViewMode('patient');}} />;"
content = content.replace(old_doc_logout, new_doc_logout)

# 4. Update onLogout for patient (search for setToken(null))
old_pat_logout = "onClick={() => {\n                setToken(null);\n                localStorage.removeItem('med_token');\n              }}"
new_pat_logout = "onClick={() => {\n                setToken(null);\n                localStorage.removeItem('med_token');\n                localStorage.removeItem('med_role');\n              }}"
content = content.replace(old_pat_logout, new_pat_logout)


with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched role persistence")
