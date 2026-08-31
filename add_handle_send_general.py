import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_func = '''
  const handleSendGeneral = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && !selectedImagePreview && !selectedPdfName) return;

    const userMsg = { 
      type: "user", 
      text: inputMessage,
      image: selectedImagePreview,
      pdf: selectedPdfName
    };
    
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage("");
    setIsLoading(true);
    clearAttachments();

    try {
      const response = await fetch(${API_URL}/api/chat/general, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          messages: newMessages.map(m => ({
            role: m.type === "user" ? "user" : "assistant",
            content: m.text
          })),
          language: navigator.language
        })
      });

      if (!response.ok) throw new Error("Error en red");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiText = "";
      
      setMessages([...newMessages, { type: "ai", text: "" }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiText += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].text = aiText;
          return updated;
        });
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { type: "ai", text: "Error de conexin." }]);
    } finally {
      setIsLoading(false);
    }
  };
'''

if 'const handleSendGeneral =' not in content:
    content = content.replace("  const handleSend =", new_func + "\n  const handleSend =")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added handleSendGeneral")
