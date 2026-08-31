import os

file_path = 'C:/Users/crist/.gemini/antigravity/brain/be37f564-e4b0-4ba0-8d02-cd2f0f1bdc2e/task.md'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('- [ ] Implement Step 3: Verificación Profesional (UI file upload).', '- [x] Implement Step 3: Verificación Profesional (UI file upload).')
content = content.replace('- [ ] Implement Step 4: Perfil Opcional (UI file upload).', '- [x] Implement Step 4: Perfil Opcional (UI file upload).')
content = content.replace('- [ ] Implement Step 5: Éxito.', '- [x] Implement Step 5: Éxito.')
content = content.replace('- [ ] Update App.jsx and Login to route to DoctorOnboarding.', '- [x] Update App.jsx and Login to route to DoctorOnboarding.')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
