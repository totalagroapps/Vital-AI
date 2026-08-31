import os
import re

file_path = 'frontend/src/DoctorDashboard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
if 'import DoctorHome' not in content:
    content = content.replace("import React, { useState, useEffect, useRef } from 'react';", "import React, { useState, useEffect, useRef } from 'react';\nimport DoctorHome from './views/DoctorHome';")

# Add state
if 'const [doctorScreen' not in content:
    content = content.replace("const [patients, setPatients] = useState([]);", "const [doctorScreen, setDoctorScreen] = useState('home');\n    const [patients, setPatients] = useState([]);")

# Add routing logic before return
routing = '''
  if (doctorScreen === 'home') {
    return <DoctorHome onNavigate={setDoctorScreen} onLogout={onLogout} />;
  }

  return (
'''
content = content.replace("  return (\n    <div className=\"flex w-full", routing + "    <div className=\"flex w-full")

# Fix desktop view to have a back button if they want to go home
# We'll just add a small back button in the left sidebar
back_btn = '''
        <button onClick={() => setDoctorScreen('home')} className="w-12 h-12 text-gray-400 hover:bg-gray-50 hover:text-gray-600 rounded-xl flex items-center justify-center transition-all mt-auto mb-2" title="Volver al Inicio">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button onClick={onLogout}
'''
if 'ArrowLeft' not in content:
    content = content.replace("import { Download", "import { ArrowLeft, Download")
content = content.replace("        <button onClick={onLogout}", back_btn)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("DoctorDashboard patched with DoctorHome routing!")
