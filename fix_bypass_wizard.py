import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix handleNavigate
old_handle = """    const screenMap = {
      'home': '/paciente',
      'general_chat': '/paciente/chat',
      'documents': '/paciente/documentos',
      'history': '/paciente/historial',
      'triage': '/paciente/triaje',
      'doctors': '/paciente/doctors'
    };
    navigate(screenMap[screen] || '/paciente');
  };"""

new_handle = """    const screenMap = {
      'home': '/paciente',
      'general_chat': '/paciente/chat',
      'documents': '/paciente/documentos',
      'history': '/paciente/historial',
      'triage': '/paciente/asistente',
      'doctors': '/paciente/doctors'
    };
    if (screen === 'triage') startTriageSession();
    navigate(screenMap[screen] || '/paciente');
  };"""

content = content.replace(old_handle, new_handle)

# Fix BottomNav
old_bottom = """        <BottomNav activeTab="home" onTabChange={(tab) => {
          if (tab === 'home') navigate('/paciente');
          if (tab === 'ai') navigate('/paciente/triaje');
          if (tab === 'patients') {"""

new_bottom = """        <BottomNav activeTab="home" onTabChange={(tab) => {
          if (tab === 'home') navigate('/paciente');
          if (tab === 'ai') {
            startTriageSession();
            navigate('/paciente/asistente');
          }
          if (tab === 'patients') {"""

content = content.replace(old_bottom, new_bottom)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Bypassed wizard in App.jsx")
