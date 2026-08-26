import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_cond = '            if "📝 Informe de Prediagnóstico y Triaje" in full_response or "Informe de Prediagnóstico y Triaje" in full_response:'
new_cond = '            if "Informe de Prediagn" in full_response or "Informe de Emergencia" in full_response or "Nivel de Urgencia:" in full_response or "Especialidad M" in full_response:'

content = content.replace(old_cond, new_cond)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched condition")
