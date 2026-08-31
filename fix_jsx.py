import os
file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix TriageWizard
content = content.replace('''  if (patientScreen === 'triage') {
    return (
      {renderModals()}
      <TriageWizard 
        onBack={() => setPatientScreen('home')} 
        onStartChat={(symptoms) => {
          setPatientScreen('chat');
          startTriageSession();
        }} 
      />
    );
  }''', '''  if (patientScreen === 'triage') {
    return (
      <>
        {renderModals()}
        <TriageWizard 
          onBack={() => setPatientScreen('home')} 
          onStartChat={(symptoms) => {
            setPatientScreen('chat');
            startTriageSession();
          }} 
        />
      </>
    );
  }''')

# Fix DocumentAnalyzer
content = content.replace('''  if (patientScreen === 'documents') {
    return (
      {renderModals()}
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
  }''', '''  if (patientScreen === 'documents') {
    return (
      <>
        {renderModals()}
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
      </>
    );
  }''')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed JSX fragments!")
