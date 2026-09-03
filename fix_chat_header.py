import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'const response = await fetch\(`\$\{API_URL\}/api/chat/general`, \{\s*method: "POST",\s*headers: authHeaders,'
repl = 'const response = await fetch(`${API_URL}/api/chat/general`, {\n        method: "POST",\n        headers: { ...authHeaders, "Content-Type": "application/json" },'

content = re.sub(pattern, repl, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added Content-Type to handleSendGeneral in App.jsx")
