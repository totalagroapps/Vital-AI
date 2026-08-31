import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I need to add general_chat routing
new_routing = '''
        {patientScreen === 'general_chat' && (
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
        )}
'''

if 'patientScreen === \'general_chat\'' not in content:
    content = content.replace("{patientScreen === 'chat' && (", new_routing + "\n        {patientScreen === 'chat' && (")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added general_chat routing to App.jsx")
