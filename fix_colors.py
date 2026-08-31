import os
file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('text-gray-900', 'text-content-primary')
content = content.replace('text-gray-500', 'text-content-secondary')
content = content.replace('text-gray-400', 'text-content-secondary/70')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
