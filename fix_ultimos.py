import os
file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('ltimos avances', '&#250;ltimos avances')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
