import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_wizard = """        <TriageWizard 
          onBack={() => navigate('/paciente')} 
          onStartChat={(symptoms) => {
            setPatientScreen('chat');
            // In App.jsx, there's no setInputMessage out of the box because it's a controlled input 
            // However, we can just start the triage session. For simplicity, we'll just open the chat.
            startTriageSession();
          }} />"""

new_wizard = """        <TriageWizard 
          onBack={() => navigate('/paciente')} 
          onStartChat={(symptoms) => {
            navigate('/paciente/asistente');
            setInputMessage(symptoms);
            startTriageSession();
          }} />"""

if old_wizard in content:
    content = content.replace(old_wizard, new_wizard)
else:
    print("Warning: old_wizard not found in exact string format. Attempting regex.")
    pattern = r'<TriageWizard[^>]*onStartChat=\{\(symptoms\) => \{[^}]*\}\}\s*/>'
    content = re.sub(pattern, new_wizard, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched TriageWizard onStartChat in App.jsx")
