import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports
import_router = "import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';\n"
content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\n" + import_router)

# 2. Replace manual navigation logic
nav_target = '''  const handleNavigate = (path) => {
    setPatientScreen(path);
    window.history.pushState({ screen: path }, '', /);
  };

  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.screen) {
        setPatientScreen(event.state.screen);
      } else {
        const path = window.location.pathname.substring(1);
        if (['home', 'triage', 'documents', 'history', 'general_chat'].includes(path)) {
          setPatientScreen(path);
        } else {
          setPatientScreen('home');
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);'''

nav_repl = '''  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path) => {
    // legacy support for children calling onNavigate
    if (path === 'home') navigate('/paciente');
    else if (path === 'triage') navigate('/paciente/triaje');
    else if (path === 'documents') navigate('/paciente/documentos');
    else if (path === 'history') navigate('/paciente/historial');
    else if (path === 'general_chat') navigate('/paciente/chat');
    else if (path === 'doctors') navigate('/paciente/directorio');
    else navigate(/);
  };'''

content = content.replace(nav_target, nav_repl)

# 3. Handle routing using Routes and Route instead of if/else
# Let's just create the Routes wrapper.
# Find where the top-level returns begin:
top_level_start = '''  if (showDoctorOnboarding) {'''
# Replace top level if/else with Routes wrapper
# We will create a helper function or just map it inside Routes.
# It's better to just use React Router hooks to get the path and then conditionally return the screen body as before, to avoid wrapping massive JSX in <Route element={...}>

router_logic = '''  const path = location.pathname;

  if (path === '/' || path === '') {
    if (!token) return <Navigate to="/login" />;
    return <Navigate to={viewMode === 'doctor' ? '/medico' : '/paciente'} />;
  }

  if (path === '/registro/medico') {
    return <DoctorOnboarding onNavigateLogin={() => navigate('/login')} />;
  }

  if (!token && path !== '/login') {
    return <Navigate to="/login" />;
  }

  if (path === '/login') {
    if (token) return <Navigate to={viewMode === 'doctor' ? '/medico' : '/paciente'} />;
    return <Auth 
      onLogin={(jwt, role) => { 
        setToken(jwt); 
        localStorage.setItem('med_token', jwt); 
        if(role) { 
          setViewMode(role); 
          localStorage.setItem('med_role', role); 
          navigate(role === 'doctor' ? '/medico' : '/paciente');
        } else {
          navigate('/paciente');
        }
      }} 
      apiUrl={API_URL} 
      onNavigateDoctorRegister={() => navigate('/registro/medico')}
    />;
  }

  if (path.startsWith('/medico')) {
    if (viewMode !== 'doctor') return <Navigate to="/paciente" />;
    return <DoctorDashboard apiUrl={API_URL} authHeaders={authHeaders} onLogout={() => {
      setToken(null); 
      localStorage.removeItem('med_token'); 
      localStorage.removeItem('med_role'); 
      setViewMode('patient');
      navigate('/login');
    }} />;
  }

  // If we reach here, we are in a patient route
  if (viewMode === 'doctor') return <Navigate to="/medico" />;
'''

content = content.replace('''  if (showDoctorOnboarding) {
    return <DoctorOnboarding onNavigateLogin={() => setShowDoctorOnboarding(false)} />;
  }

  if (!token) {
    return <Auth 
      onLogin={(jwt, role) => { setToken(jwt); localStorage.setItem('med_token', jwt); if(role) { setViewMode(role); localStorage.setItem('med_role', role); } }} 
      apiUrl={API_URL} 
      onNavigateDoctorRegister={() => setShowDoctorOnboarding(true)}
    />;
  }

  if (viewMode === 'doctor') {
    return <DoctorDashboard apiUrl={API_URL} authHeaders={authHeaders} onLogout={() => {setToken(null); localStorage.removeItem('med_token'); localStorage.removeItem('med_role'); setViewMode('patient');}} />;
  }''', router_logic)


# Now replace if (patientScreen === '...') with path checks
content = content.replace("}if (patientScreen === 'history') {", "}if (path === '/paciente/historial') {")
content = content.replace("if (patientScreen === 'history') {", "if (path === '/paciente/historial') {")

content = content.replace("if (patientScreen === 'home') {", "if (path === '/paciente') {")
content = content.replace("if (patientScreen === 'triage') {", "if (path === '/paciente/triaje') {")
content = content.replace("if (patientScreen === 'documents') {", "if (path === '/paciente/documentos') {")
content = content.replace("if (patientScreen === 'general_chat') {", "if (path === '/paciente/chat') {")

# The last one is just if (patientScreen === 'chat') { (wait, what is chat vs general_chat?)
# Let's check if there is a chat screen.
content = content.replace("if (patientScreen === 'chat') {", "if (path === '/paciente/asistente') {")


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.jsx routing logic")
