import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = '''  const startTriageSession = async () => {
    try {
      const res = await fetch(${API_URL}/api/triage/start, { method: 'POST', headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setTriageSessionId(data.session_id);
        setIsTriageClosed(false);
        setMessages([{ id: Date.now(), type: 'ai', text: 'Hola. Soy tu Asistente de Triaje M\u00e9dico. Por favor, descr\u00edbeme tus s\u00edntomas actuales para comenzar la evaluaci\u00f3n cl\u00ednica.', phiScrubbed: false }]);
      }
    } catch (err) {
      console.error("Error iniciando sesi\u00f3n de triaje:", err);
    }
  };'''
  
# Note: I'll use simple start/end string replacement to avoid encoding issues
start_marker = "  const startTriageSession = async () => {"
end_marker = "console.error(\"Error iniciando sesi\u00f3n de triaje:\", err);\n    }\n  };"

if start_marker in content:
    print("Found marker")
    
