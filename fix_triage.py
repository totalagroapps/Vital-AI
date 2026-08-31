import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''  const startTriageSession = async () => {
    try {
      const res = await fetch(${API_URL}/api/triage/start, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      setTriageSessionId(data.session_id);
    } catch (e) {
      console.error(e);
    }
  };'''

repl = '''  const startTriageSession = async () => {
    try {
      const res = await fetch(${API_URL}/api/triage/start, {
        method: 'POST',
        headers: authHeaders
      });
      if (!res.ok) throw new Error("Fallo en la comunicación con el servidor");
      const data = await res.json();
      setTriageSessionId(data.session_id);
    } catch (e) {
      console.error(e);
      alert("Error al iniciar la sesión de triaje. Verifica tu conexión.");
      handleNavigate('home');
    }
  };'''

if target in content:
    content = content.replace(target, repl)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated startTriageSession in App.jsx successfully")
