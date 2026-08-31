import os

file_path = 'frontend/src/views/TriageWizard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add Mic to imports
content = content.replace(
    "import { ArrowLeft, Send, Activity, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';",
    "import { ArrowLeft, Send, Activity, Info, AlertTriangle, CheckCircle2, Mic } from 'lucide-react';"
)

# Add state and useEffect for speech recognition
hook_injection = '''const [symptoms, setSymptoms] = useState('');
  const [isListening, setIsListening] = useState(false);

  React.useEffect(() => {
    const shouldAutoStart = localStorage.getItem('autoStartMic') === 'true';
    if (shouldAutoStart) {
      localStorage.removeItem('autoStartMic');
      setTimeout(() => {
        toggleListening();
      }, 500);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSymptoms(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    try { recognition.start(); } catch (e) { setIsListening(false); }
  };'''

content = content.replace("const [symptoms, setSymptoms] = useState('');", hook_injection)

# Add the Mic button to the UI
textarea_block = '''<textarea 
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Empieza a escribir aquí..."
                className="w-full h-32 resize-none outline-none text-sm text-gray-700 placeholder-gray-400"
              />'''

new_textarea_block = '''<textarea 
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Empieza a escribir aquí..."
                className="w-full h-32 resize-none outline-none text-sm text-gray-700 placeholder-gray-400"
              />
              <button 
                onClick={toggleListening}
                className={bsolute bottom-2 right-2 p-2 rounded-full transition-colors }
              >
                <Mic size={18} />
              </button>'''

content = content.replace(textarea_block, new_textarea_block)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("TriageWizard injected!")
