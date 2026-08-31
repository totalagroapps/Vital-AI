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

# 2. Fix the fallback UI issue. If none of the 'if' statements match and viewMode is 'patient', it should default to PatientHome instead of DoctorDashboard fallback.
# Let's find the fallback comment and replace the fallback UI.
fallback_pattern = re.compile(r'// Fallback to old UI\s+return \(\s+<div className="flex h-\[100dvh\] bg-base text-content-primary overflow-hidden">.*?</div>\s+\);\s+}\s*export default App;', re.DOTALL)

new_fallback = '''// Fallback to old UI for doctors, or home for patients
  if (viewMode === 'doctor') {
    return <DoctorDashboard apiUrl={API_URL} authHeaders={authHeaders} onLogout={() => {setToken(null); localStorage.removeItem('med_token'); localStorage.removeItem('med_role'); setViewMode('patient');}} />;
  }
  
  // Safe fallback for patients if screen is invalid
  return (
    <>
      <PatientHome 
        onNavigate={handleNavigate} 
        onLogout={handleLogout}
      />
      <BottomNav activeTab="home" onTabChange={(tab) => {
        if (tab === 'home') handleNavigate('home');
        if (tab === 'ai') handleNavigate('triage');
        if (tab === 'patients') {
          handleNavigate('history');
          fetchPatientProfile();
          fetchHistory();
        }
        if (tab === 'agenda') alert('Agenda en desarrollo...');
      }} />
    </>
  );
}

export default App;'''

content = fallback_pattern.sub(new_fallback, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Applied App.jsx fixes")
