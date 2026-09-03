import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the refs from general_chat block
target_block = '''  if (patientScreen === 'general_chat') {
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
  }'''

new_block = '''  if (patientScreen === 'general_chat') {
    return (
      <PatientChat 
        messages={messages}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSend={handleSendGeneral}
        isLoading={isLoading}
        onBack={() => handleNavigate('home')}
      />
    );
  }'''

content = content.replace(target_block, new_block)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated App.jsx general_chat block")
