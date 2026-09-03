import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add handleNavigate function before useEffect for popstate
handle_nav_func = '''
  const handleNavigate = (screen) => {
    setPatientScreen(screen);
    const path = screen === 'home' ? '/' : /;
    window.history.pushState({ screen }, '', path);
  };

'''
if "const handleNavigate =" not in content:
    content = content.replace("  // History API integration", handle_nav_func + "  // History API integration")

# 2. Update PatientHome onNavigate to use handleNavigate
content = content.replace(
    '''        <PatientHome 
          onNavigate={(screen) => {
            if (screen === 'history') {
              setPatientScreen('chat');
              fetchPatientProfile();
      fetchHistory();
              setShowMedicalHistory(true);
            } else if (screen === 'doctors') {
              alert('El m\u00f3dulo de especialistas se encuentra en desarrollo. \u00a1Pronto disponible!');
            } else {
              setPatientScreen(screen);
            }
          }}''',
    '''        <PatientHome 
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
          }}'''
)
# Note: I replaced unicode \u00f3 etc with the literal, wait... the original file might have literal characters or html entities.
# Let's do a regex replace to be safer.
