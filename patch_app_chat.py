import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add PatientChat to imports
if 'import PatientChat' not in content:
    content = content.replace("import DocumentAnalyzer from './views/DocumentAnalyzer';", "import DocumentAnalyzer from './views/DocumentAnalyzer';\nimport PatientChat from './views/PatientChat';")

# 2. Find the MedicalHistory modal JSX and extract it into a render function inside App component
modal_start = content.find('{showMedicalHistory && (')
modal_end = content.find('{/* Config (Ollama) Modal */}')

if modal_start != -1 and modal_end != -1:
    modal_jsx = content[modal_start:modal_end]
    # Remove it from the old return block
    content = content[:modal_start] + content[modal_end:]
    
    # Inject it as a helper function right before the early returns
    helper_fn = f'''
  const renderModals = () => (
    <>
      {modal_jsx}
    </>
  );

  if (patientScreen === 'home') {{
'''
    content = content.replace("  if (patientScreen === 'home') {", helper_fn)

# 3. Update the early returns to include renderModals()
content = content.replace("<PatientHome ", "{renderModals()}\n        <PatientHome ")
content = content.replace("<TriageWizard ", "{renderModals()}\n        <TriageWizard ")
content = content.replace("<DocumentAnalyzer ", "{renderModals()}\n        <DocumentAnalyzer ")

# 4. Add the PatientChat early return
chat_logic = '''  if (patientScreen === 'chat') {
    return (
      <>
        {renderModals()}
        <PatientChat 
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSend={handleSend}
          isLoading={isLoading}
          onBack={() => setPatientScreen('home')}
          imageInputRef={imageInputRef}
          pdfInputRef={pdfInputRef}
          handleImageChange={handleImageChange}
          handlePdfChange={handlePdfChange}
          selectedImagePreview={selectedImagePreview}
          selectedPdfName={selectedPdfName}
          onClearAttachment={() => {
            setSelectedImage(null); setSelectedImagePreview(null); setSelectedImageFile(null);
            setSelectedPdf(null); setSelectedPdfName(null); setSelectedPdfFile(null);
          }}
        />
      </>
    );
  }

  // Fallback to old UI
'''
content = content.replace("  return (\n    <div className=\"flex h-[100dvh]", chat_logic + "  return (\n    <div className=\"flex h-[100dvh]")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App patched for PatientChat and Modals!")
