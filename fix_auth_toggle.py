import os
import re

file_path = 'frontend/src/Auth.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """              <button 
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}"""

repl = """              <button 
                type="button"
                onClick={() => {
                  if (isDoc && !isRegistering) {
                    onNavigateDoctorRegister();
                  } else {
                    setIsRegistering(!isRegistering);
                    setError('');
                  }
                }}"""

content = content.replace(target, repl)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed toggle button in Auth.jsx")
