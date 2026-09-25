import re

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. DoctorHome.jsx
replace_in_file(r'C:\Users\crist\OneDrive\Documentos\Proyecto\frontend\src\views\DoctorHome.jsx', [
    ('>Consensus<', '>MIVOR Evidencia<'),
    ('Consensus: Medidor de Evidencia', 'MIVOR Evidencia: Medidor de Evidencia'),
])

# 2. DoctorHomeDesktop.jsx
replace_in_file(r'C:\Users\crist\OneDrive\Documentos\Proyecto\frontend\src\views\DoctorHomeDesktop.jsx', [
    ('>Consensus<', '>MIVOR Evidencia<'),
])

# 3. DoctorDashboard.jsx
replace_in_file(r'C:\Users\crist\OneDrive\Documentos\Proyecto\frontend\src\DoctorDashboard.jsx', [
    ('>Consensus<', '>MIVOR Evidencia<'),
    ('title="Consensus:', 'title="MIVOR Evidencia:'),
    ('>MedAlly Scribe<', '>MIVOR Scribe<'),
    ('title="MedAlly:', 'title="MIVOR Scribe:'),
])

# 4. ConsensusMeterModal.jsx
replace_in_file(r'C:\Users\crist\OneDrive\Documentos\Proyecto\frontend\src\views\ConsensusMeterModal.jsx', [
    ('Consensus MIVOR', 'MIVOR Evidencia'),
    ('MIVOR Consensus recopila', 'MIVOR Evidencia recopila'),
])
