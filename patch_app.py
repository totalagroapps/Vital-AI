import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add imports
imports_to_add = '''import PatientHome from './views/PatientHome';
import TriageWizard from './views/TriageWizard';
import DocumentAnalyzer from './views/DocumentAnalyzer';
import BottomNav from './components/BottomNav';
'''
content = content.replace("import Auth from './Auth';", imports_to_add + "import Auth from './Auth';")

# 2. Add state
state_to_add = "  const [patientScreen, setPatientScreen] = useState('home');\n"
content = content.replace("const [username, setUsername] = useState(null);", "const [username, setUsername] = useState(null);\n" + state_to_add)

# 3. Replace Patient return logic
# The original logic starts with: eturn (\n    <div className="flex h-[100dvh] bg-base text-content-primary overflow-hidden">
# I will replace it so that it conditionally renders the new views.

old_return_start = '''  return (
    <div className="flex h-[100dvh] bg-base text-content-primary overflow-hidden">'''

new_return_start = '''  if (patientScreen === 'home') {
    return (
      <>
        <PatientHome onNavigate={setPatientScreen} />
        <BottomNav activeTab="home" onTabChange={(tab) => {
          if (tab === 'home') setPatientScreen('home');
          if (tab === 'ai') setPatientScreen('triage');
        }} />
      </>
    );
  }

  if (patientScreen === 'triage') {
    return (
      <TriageWizard 
        onBack={() => setPatientScreen('home')} 
        onStartChat={(symptoms) => {
          setPatientScreen('chat');
          setInputMessage(symptoms);
          startTriageSession(); // From original code
        }} 
      />
    );
  }

  if (patientScreen === 'documents') {
    return (
      <DocumentAnalyzer 
        onBack={() => setPatientScreen('home')}
        isUploading={isLoading}
        onAskQuestion={() => setPatientScreen('chat')}
        onUpload={async (file) => {
          if (file.type.startsWith('image/')) {
            setSelectedImageFile(file);
            setSelectedImage(true);
            const reader = new FileReader();
            reader.onload = (e) => setSelectedImagePreview(e.target.result);
            reader.readAsDataURL(file);
          } else {
            setSelectedPdfFile(file);
            setSelectedPdf(true);
          }
          // Note: App.jsx handleSend handles the actual upload when they press send.
          // To make the wizard upload immediately, we can fake it or let them press "Ask question"
          alert("Archivo seleccionado. Ve a preguntar para procesarlo.");
        }}
      />
    );
  }

  return (
    <div className="flex h-[100dvh] bg-base text-content-primary overflow-hidden pb-16">
      <div className="absolute top-4 left-4 z-50">
        <button onClick={() => setPatientScreen('home')} className="bg-white/80 p-2 rounded-full shadow-sm text-gray-600">Volver al inicio</button>
      </div>'''

content = content.replace(old_return_start, new_return_start)

# Add BottomNav to the end of the chat view
content = content.replace("    </div>\n  );\n}", "    </div>\n      <BottomNav activeTab=\"ai\" onTabChange={(tab) => { if(tab==='home') setPatientScreen('home'); }} />\n    </div>\n  );\n}")

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("App.jsx patched!")
