import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_routing = '''
    if (patientScreen === 'general_chat') {
      return (
        <PatientChat 
          messages={messages}
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSend={handleSendGeneral}
          isLoading={isLoading}
          onBack={() => setPatientScreen('home')}
          imageInputRef={imageInputRef}
          pdfInputRef={pdfInputRef}
          handleImageChange={handleImageChange}
          handlePdfChange={handlePdfChange}
          selectedImagePreview={selectedImagePreview}
          selectedPdfName={selectedPdfName}
          onClearAttachment={clearAttachments}
        />
      );
    }
'''

if "patientScreen === 'general_chat'" not in content:
    content = content.replace("    if (patientScreen === 'chat') {", new_routing + "\n    if (patientScreen === 'chat') {")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added general_chat to App.jsx")
