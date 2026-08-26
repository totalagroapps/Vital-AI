import os

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_endpoint_logic = '''      const endpoint = triageSessionId 
        ? \\/api/triage/\/message\
        : \\/api/triage/chat\;

      const res = await fetch(endpoint, {'''

new_endpoint_logic = '''      let endpoint;
      let isStandardChat = currentSessionId !== null || selectedImage !== null || selectedPdf !== null;
      let finalSessionId = currentSessionId;
      
      if (isStandardChat && !currentSessionId) {
          const startRes = await fetch(\\/api/chat/start\, {
              method: 'POST',
              headers: authHeaders
          });
          const startData = await startRes.json();
          finalSessionId = startData.session_id;
          setCurrentSessionId(finalSessionId);
          loadSessions();
      }

      if (finalSessionId) {
          endpoint = \\/api/chat/\/message\;
      } else {
          endpoint = triageSessionId 
            ? \\/api/triage/\/message\
            : \\/api/triage/chat\;
      }

      const res = await fetch(endpoint, {'''

content = content.replace(old_endpoint_logic, new_endpoint_logic)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched handleSend routing logic")
