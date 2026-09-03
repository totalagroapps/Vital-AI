import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Normalize line endings for replacement
content_normalized = content.replace('\r\n', '\n')

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

if old_wizard in content_normalized:
    content_normalized = content_normalized.replace(old_wizard, new_wizard)
else:
    print("Failed to find block!")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content_normalized)
print("Patched App.jsx!")
