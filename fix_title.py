import os
import re

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'<h3 className="text-lg md:text-xl font-bold text-center">([^<]+)</h3>', r'<h3 className="text-lg md:text-xl font-bold text-center text-gray-900">\1</h3>', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated title color!")
