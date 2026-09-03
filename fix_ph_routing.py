import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the onNavigate prop of PatientHome when patientScreen === 'home'
content = re.sub(
    r'<PatientHome\s*onNavigate=\{\(screen\) => \{.*?(?:setPatientScreen\(screen\);\s*\}\s*\}\})\s*onLogout=\{handleLogout\}\s*/>',
    r'''<PatientHome 
          onNavigate={(screen) => {
            if (screen === 'doctors') {
              alert('El m\u00f3dulo de especialistas se encuentra en desarrollo. \u00a1Pronto disponible!');
            } else {
              if (screen === 'history') {
                fetchPatientProfile();
                fetchHistory();
              }
              handleNavigate(screen);
            }
          }} 
          onLogout={handleLogout}
        />''',
    content,
    flags=re.DOTALL
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated PatientHome routing in App.jsx")
