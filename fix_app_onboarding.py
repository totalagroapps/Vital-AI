import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = "import DoctorOnboarding from './views/DoctorOnboarding';\n"
if "import DoctorOnboarding" not in content:
    content = content.replace("import Auth from './Auth';", import_stmt + "import Auth from './Auth';")

# Add state
state_target = "const [viewMode, setViewMode] = useState(localStorage.getItem('med_role') || 'patient'); // 'patient' | 'doctor'"
state_repl = "const [viewMode, setViewMode] = useState(localStorage.getItem('med_role') || 'patient'); // 'patient' | 'doctor'\n  const [showDoctorOnboarding, setShowDoctorOnboarding] = useState(false);"

content = content.replace(state_target, state_repl)

# Add render logic
render_target = '''  if (!token) {
    return <Auth onLogin={(jwt, role) => { setToken(jwt); localStorage.setItem('med_token', jwt); if(role) { setViewMode(role); localStorage.setItem('med_role', role); } }} apiUrl={API_URL} />;
  }'''

render_repl = '''  if (showDoctorOnboarding) {
    return <DoctorOnboarding onNavigateLogin={() => setShowDoctorOnboarding(false)} />;
  }

  if (!token) {
    return <Auth 
      onLogin={(jwt, role) => { setToken(jwt); localStorage.setItem('med_token', jwt); if(role) { setViewMode(role); localStorage.setItem('med_role', role); } }} 
      apiUrl={API_URL} 
      onNavigateDoctorRegister={() => setShowDoctorOnboarding(true)}
    />;
  }'''

content = content.replace(render_target, render_repl)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.jsx")
