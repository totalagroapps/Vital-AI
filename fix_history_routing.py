import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_routing = '''          <PatientHome 
            onNavigate={(screen) => {
              if (screen === 'history') {
                navigateToScreen('chat');
                fetchPatientProfile();
                setShowMedicalHistory(true);
              } else if (screen === 'doctors') {'''

good_routing = '''          <PatientHome 
            onNavigate={(screen) => {
              if (screen === 'history') {
                navigateToScreen('history');
                fetchPatientProfile();
              } else if (screen === 'doctors') {'''

content = content.replace(bad_routing, good_routing)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed history routing!")
