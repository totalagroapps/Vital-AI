import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''        <PatientHome 
          onNavigate={(screen) => {
            if (screen === 'history') {
              setPatientScreen('chat');
              fetchPatientProfile();
      fetchHistory();
              setShowMedicalHistory(true);
            } else if (screen === 'doctors') {
              alert('El módulo de especialistas se encuentra en desarrollo. ¡Pronto disponible!');
            } else {
              setPatientScreen(screen);
            }
          }} 
          onLogout={handleLogout}
        />'''

repl = '''        <PatientHome 
          onNavigate={(screen) => {
            if (screen === 'doctors') {
              alert('El módulo de especialistas se encuentra en desarrollo. ¡Pronto disponible!');
            } else {
              if (screen === 'history') {
                fetchPatientProfile();
                fetchHistory();
              }
              handleNavigate(screen);
            }
          }} 
          onLogout={handleLogout}
        />'''

if target in content:
    content = content.replace(target, repl)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated PatientHome in App.jsx successfully")
else:
    print("Target not found. Doing partial replace.")
