import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """          <PatientHome 
            onLogout={handleLogout}
            onNavigate={(screen) => {
              if (screen === 'doctors') {
                alert('El mdulo de especialistas se encuentra en desarrollo. Pronto disponible!');
              } else {
                if (screen === 'history') {
                  fetchPatientProfile();
                  fetchHistory();
                }
                handleNavigate(screen);
              }
            }} 
            onLogout={handleLogout}
          />"""

repl = """          <PatientHome 
            onLogout={handleLogout}
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
          />"""

content = content.replace(target, repl)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed duplicated onLogout properly")
