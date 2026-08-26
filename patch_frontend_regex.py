import os
import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = r'''      const endpoint = triageSessionId \n        \? \\$\{API_URL\}/api/triage/\$\{triageSessionId\}/message\\n        : \\$\{API_URL\}/api/triage/chat\;\n\n      const res = await fetch\(endpoint, \{'''

new_logic = '''      let endpoint;
      let finalSessionId = currentSessionId;
      
      if (!currentSessionId && (documentContext !== "" || selectedImage || selectedPdf)) {
          const startRes = await fetch(${API_URL}/api/chat/start, {
              method: 'POST',
              headers: authHeaders
          });
          if (startRes.ok) {
              const startData = await startRes.json();
              finalSessionId = startData.session_id;
              setCurrentSessionId(finalSessionId);
              loadSessions();
          }
      }

      if (finalSessionId) {
          endpoint = ${API_URL}/api/chat//message;
      } else {
          endpoint = triageSessionId 
            ? ${API_URL}/api/triage//message
            : ${API_URL}/api/triage/chat;
      }

      const res = await fetch(endpoint, {'''

content = re.sub(old_logic, new_logic, content)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Regex replace applied")
