import os
import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''                if "rojo" in full_response.lower() or "urgencia" in full_response.lower():
                    t_session.status = "closed_red"
                elif "amarillo" in full_response.lower() or "temprana" in full_response.lower():
                    t_session.status = "closed_yellow"
                else:
                    t_session.status = "closed_green"
                
                t_session.final_report = full_response'''

new_block = '''                if "rojo" in full_response.lower() or "urgencia" in full_response.lower():
                    t_session.status = "closed_red"
                elif "amarillo" in full_response.lower() or "temprana" in full_response.lower():
                    t_session.status = "closed_yellow"
                else:
                    t_session.status = "closed_green"
                
                t_session.final_report = full_response
                
                # Extraer la especialidad recomendada
                import re
                specialty_match = re.search(r'\*\*.*Especialidad.*:\*\*\s*(.+)', full_response, re.IGNORECASE)
                if not specialty_match:
                    specialty_match = re.search(r'Especialidad M.dica Recomendada:\s*(.+)', full_response, re.IGNORECASE)
                if specialty_match:
                    t_session.recommended_specialty = specialty_match.group(1).strip(' *')
'''

if 't_session.recommended_specialty =' not in content:
    content = content.replace(old_block, new_block)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected specialty extraction")
