import os

file_path = 'frontend/src/Auth.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('export default function Auth({ onLogin, apiUrl }) {', 'export default function Auth({ onLogin, apiUrl, onNavigateDoctorRegister }) {')

target_btn = '''              <button 
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}'''

repl_btn = '''              <button 
                type="button"
                onClick={() => {
                  if (isDoc && !isRegistering) {
                    if (onNavigateDoctorRegister) {
                      onNavigateDoctorRegister();
                      return;
                    }
                  }
                  setIsRegistering(!isRegistering);
                  setError('');
                }}'''

content = content.replace(target_btn, repl_btn)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Auth.jsx")
