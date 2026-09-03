import os

file_path = 'frontend/src/Auth.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the specific onClick handler
old_code = "setIsRegistering(!isRegistering);\n                  setError('');"
new_code = "if (isDoc && !isRegistering) { onNavigateDoctorRegister(); } else { setIsRegistering(!isRegistering); setError(''); }"

# normalize line endings for safe replace
content = content.replace('\r\n', '\n')
content = content.replace(old_code, new_code)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed Auth.jsx toggle")
