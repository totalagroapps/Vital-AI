import os
file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add text-content-primary to the button classes themselves to force inheritance if needed
content = content.replace(
    'className="bg-white rounded-2xl md:rounded-3xl p-4 text-left border border-gray-100',
    'className="bg-white rounded-2xl md:rounded-3xl p-4 text-left text-content-primary border border-gray-100'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
