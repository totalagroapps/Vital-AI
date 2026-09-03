import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r"return \(\s*\{renderModals\(\)\}\s*<TriageWizard", "return (\\n      <>\\n        {renderModals()}\\n        <TriageWizard", content)
content = re.sub(r"\}\s*\/>\s*\);\s*\}\s*if \(patientScreen === 'documents'", "} />\\n      </>\\n    );\\n  }\\n\\n  if (patientScreen === 'documents'", content)

content = re.sub(r"return \(\s*\{renderModals\(\)\}\s*<DocumentAnalyzer", "return (\\n      <>\\n        {renderModals()}\\n        <DocumentAnalyzer", content)
content = re.sub(r"setPatientScreen\('chat'\);\s*\}\}\s*\/>\s*\);\s*\}", "setPatientScreen('chat');\\n        }} />\\n      </>\\n    );\\n  }", content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Regex patched!")
