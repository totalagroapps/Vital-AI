import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix handleNavigate
old_handle = """  const handleNavigate = (screen) => {
    setPatientScreen(screen);
    const path = screen === 'home' ? '/' : `/${screen}`;
    window.history.pushState({ screen }, '', path);
  };"""

new_handle = """  const handleNavigate = (screen) => {
    const screenMap = {
      'home': '/paciente',
      'general_chat': '/paciente/chat',
      'documents': '/paciente/documentos',
      'history': '/paciente/historial',
      'triage': '/paciente/triaje',
      'doctors': '/paciente/doctors'
    };
    navigate(screenMap[screen] || '/paciente');
  };"""

content = content.replace(old_handle, new_handle)

# Fix BottomNav
old_bottom = """        <BottomNav activeTab="home" onTabChange={(tab) => {
          if (tab === 'home') setPatientScreen('home');
          if (tab === 'ai') setPatientScreen('triage');
          if (tab === 'patients') {
            setPatientScreen('history');
            fetchPatientProfile();
      fetchHistory();
          }
          if (tab === 'agenda') alert('Agenda en desarrollo...');
        }} />"""

new_bottom = """        <BottomNav activeTab="home" onTabChange={(tab) => {
          if (tab === 'home') navigate('/paciente');
          if (tab === 'ai') navigate('/paciente/triaje');
          if (tab === 'patients') {
            fetchPatientProfile();
            fetchHistory();
            navigate('/paciente/historial');
          }
          if (tab === 'agenda') alert('Agenda en desarrollo...');
        }} />"""

content = content.replace(old_bottom, new_bottom)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Navigation logic fixed in App.jsx")
