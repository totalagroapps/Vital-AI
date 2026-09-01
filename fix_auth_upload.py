import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'const uploadRes = await fetch\(`\$\{API_URL\}/api/documents/upload`, \{\s*method: \'POST\',\s*body: formData\s*\}\);'
repl = r"const uploadRes = await fetch(`${API_URL}/api/documents/upload`, {\n              method: 'POST',\n              headers: authHeaders,\n              body: formData\n            });"

content = re.sub(pattern, repl, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched frontend fetch upload headers")
