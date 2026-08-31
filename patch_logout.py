import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''  const handleLogout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('med_token');
    setSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
  };'''

repl = '''  const handleLogout = () => {
    setToken(null);
    setUsername(null);
    localStorage.removeItem('med_token');
    localStorage.removeItem('med_role');
    setSessions([]);
    setMessages([]);
    setCurrentSessionId(null);
    navigate('/login');
  };'''

content = content.replace(target, repl)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched handleLogout")
