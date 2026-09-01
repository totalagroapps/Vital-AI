import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'const uploadData = await uploadRes\.json\(\);\s*documentContext = `\\n\\n--- INICIO DEL REPORTE ---\\n\$\{uploadData\.extracted_text\}\\n--- FIN DEL REPORTE ---`;'
repl = r'const uploadData = await uploadRes.json();\n            documentContext = `\\n\\n--- INICIO DEL REPORTE ---\\n${uploadData.extracted_text}\\n--- FIN DEL REPORTE ---`;\n            \n            // Refrescar el perfil del paciente porque el backend acaba de auto-perfilarlo con los datos del documento\n            await fetchPatientProfile();'

content = re.sub(pattern, repl, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched handleSend to refresh profile")
