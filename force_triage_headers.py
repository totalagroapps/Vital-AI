import os

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '/api/triage/start' in line:
        lines[i] = "      const res = await fetch(${API_URL}/api/triage/start, { method: 'POST', headers: authHeaders });\n"
        break

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Forced headers update")
