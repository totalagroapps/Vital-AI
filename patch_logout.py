import os

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_logout = '''    const handleLogout = () => {
      setToken(null);
      setUsername(null);
      localStorage.removeItem('med_token');
      setSessions([]);'''

new_logout = '''    const handleLogout = () => {
      setToken(null);
      setUsername(null);
      localStorage.removeItem('med_token');
      localStorage.removeItem('med_role');
      setSessions([]);'''

if "localStorage.removeItem('med_role');" not in old_logout and "localStorage.removeItem('med_role');\n      setSessions([]);" not in content:
    content = content.replace(old_logout, new_logout)
    with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
