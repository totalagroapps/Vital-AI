import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = '''  return (
    <div className="flex h-[100dvh] bg-base text-content-primary overflow-hidden">'''

new_logic = '''  if (patientScreen === 'home') {
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
          // In App.jsx, there's no setInputMessage out of the box because it's a controlled input 
          // However, we can just start the triage session. For simplicity, we'll just open the chat.
          startTriageSession();
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
        onUpload={(file) => {
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
          alert("Archivo seleccionado. Serás redirigido al chat para preguntar sobre él.");
          setPatientScreen('chat');
        }}
      />
    );
  }

  return (
    <div className="flex h-[100dvh] bg-base text-content-primary overflow-hidden">
      {/* Botón flotante para regresar al Home si estamos en chat u otra vista vieja */}
      <div className="absolute top-4 right-4 z-50">
        <button onClick={() => setPatientScreen('home')} className="bg-brand-purple text-white px-4 py-2 rounded-full shadow-lg font-bold text-xs">Cerrar Chat</button>
      </div>'''

content = content.replace(old_logic, new_logic)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App patched!")
