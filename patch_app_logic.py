import os
file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = '''  if (patientScreen === 'home') {
    return (
      <>
        <PatientHome onNavigate={setPatientScreen} />
        <BottomNav activeTab="home" onTabChange={(tab) => {
          if (tab === 'home') setPatientScreen('home');
          if (tab === 'ai') setPatientScreen('triage');
        }} />
      </>
    );
  }'''

new_logic = '''  if (patientScreen === 'home') {
    return (
      <>
        <PatientHome 
          onNavigate={(screen) => {
            if (screen === 'history') {
              setPatientScreen('chat');
              fetchPatientProfile();
              setShowMedicalHistory(true);
            } else if (screen === 'doctors') {
              alert('El módulo de especialistas se encuentra en desarrollo. ¡Pronto disponible!');
            } else {
              setPatientScreen(screen);
            }
          }} 
          onLogout={handleLogout}
        />
        <BottomNav activeTab="home" onTabChange={(tab) => {
          if (tab === 'home') setPatientScreen('home');
          if (tab === 'ai') setPatientScreen('triage');
          if (tab === 'patients') {
            setPatientScreen('chat');
            fetchPatientProfile();
            setShowMedicalHistory(true);
          }
          if (tab === 'agenda') alert('Agenda en desarrollo...');
        }} />
      </>
    );
  }'''

content = content.replace(old_logic, new_logic)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App patched!")
