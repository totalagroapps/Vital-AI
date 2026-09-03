import os

file_path = 'frontend/src/Auth.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_fetch = '''    const payload = { 
      username, 
      password, 
      role: selectedRole === 'doctor' ? 'doctor' : 'patient' 
    };

    try {
      const res = await fetch(${apiUrl}, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        onLogin(data.token, data.role);
      } else {
        setError(data.detail || 'Error de autenticación');
      }'''

new_fetch = '''    try {
      let res;
      if (isRegistering) {
        const payload = { username, password, role: selectedRole === 'doctor' ? 'doctor' : 'patient' };
        res = await fetch(${apiUrl}/api/auth/register, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        res = await fetch(${apiUrl}/api/auth/login, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData
        });
      }
      
      const data = await res.json();

      if (res.ok) {
        onLogin(data.token ? data.token : data.access_token, data.role || (selectedRole === 'doctor' ? 'doctor' : 'patient'));
      } else {
        const errorMsg = typeof data.detail === 'string' ? data.detail : (Array.isArray(data.detail) ? data.detail[0]?.msg : 'Error de autenticación');
        setError(errorMsg || 'Error de autenticación');
      }'''

content = content.replace(old_fetch, new_fetch)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
