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

# I'll create a Wrapper component to use hooks like useNavigate if I want, but I can also just pass navigate as a prop.
# Wait, App is rendered inside BrowserRouter in main.jsx. So App CAN use useNavigate()!
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

# 3. Replace the render logic
# Look for the giant block starting at if (showDoctorOnboarding) and replace it.
# I'll find where if (showDoctorOnboarding) starts.
render_start = "if (showDoctorOnboarding) {"

# The bottom of the file has   // 1. GENERAL CHAT etc.
# I'll write a Python script that finds the start of the render block and replaces it.
