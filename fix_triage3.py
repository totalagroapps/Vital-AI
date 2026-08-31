import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'  const startTriageSession = async \(\) => \{.*?catch \(err\) \{.*?\}\n  \};', re.DOTALL)

new_func = '''  const startTriageSession = async () => {
    try {
      const res = await fetch(${API_URL}/api/triage/start, { method: 'POST', headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setTriageSessionId(data.session_id);
        setIsTriageClosed(false);
        setMessages([{ id: Date.now(), type: 'ai', text: 'Hola. Soy tu Asistente de Triaje Médico. Por favor, descríbeme tus síntomas actuales para comenzar la evaluación clínica.', phiScrubbed: false }]);
      } else {
        throw new Error("Fallo en el servidor");
      }
    } catch (err) {
      console.error("Error iniciando sesión de triaje:", err);
      alert("Error al iniciar la sesión de triaje. Verifica tu conexión o intenta de nuevo.");
      handleNavigate('home');
    }
  };'''

content = pattern.sub(new_func, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated startTriageSession successfully")
