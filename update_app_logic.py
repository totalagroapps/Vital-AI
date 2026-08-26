import os

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the chat history formatting
old_history = '''      // Preparar historial para el chat de triaje
      const chatMessages = messages.map(m => ({
        role: m.type === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));
      chatMessages.push({
        role: 'user',
        content: userText + documentContext
      });

      const endpoint = triageSessionId 
        ? \\/api/triage/\/message\
        : \\/api/triage/chat\;'''

new_history = '''      // Preparar historial
      const chatMessages = messages.map(m => ({
        role: m.type === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));
      chatMessages.push({
        role: 'user',
        content: userText + documentContext
      });

      let activeSessionId = currentSessionId;
      if (!isTriageActive && !activeSessionId) {
          const startRes = await fetch(\/api/chat/start, {
              method: 'POST',
              headers: authHeaders
          });
          if (startRes.ok) {
              const data = await startRes.json();
              activeSessionId = data.session_id;
              setCurrentSessionId(activeSessionId);
              // Fetch sessions immediately so it appears in sidebar
              fetch(\/api/sessions, { headers: authHeaders })
                .then(res => res.json())
                .then(data => setSessions(data));
          }
      }

      const endpoint = isTriageActive 
        ? (triageSessionId ? \/api/triage/\/message : \/api/triage/chat)
        : \/api/chat/\/message;'''

content = content.replace(old_history, new_history)

# 2. Fix the loadSession logic so clicking on sidebar actually loads the session correctly
old_load = '''  const loadSession = (id) => {
    setCurrentSessionId(id);
    const session = sessions.find(s => s.id === id);
    if (session) {
      setMessages(session.messages || []);
    }
  };'''

new_load = '''  const loadSession = async (id) => {
    setCurrentSessionId(id);
    setIsTriageActive(false); // Es un chat libre
    try {
      const res = await fetch(\/api/chat/\, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages.map((m, idx) => ({
          id: Date.now() + idx,
          type: m.role === 'user' ? 'user' : 'ai',
          text: m.content
        })));
      }
    } catch (e) {
      console.error(e);
    }
  };'''

content = content.replace(old_load, new_load)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.jsx routing and loadSession logic")
