import os
import re

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'\} else \{\s*setSelectedPdfFile\(file\);\s*setSelectedPdf\(true\);\s*\}'
repl = r'} else {\n            setSelectedPdfFile(file);\n            setSelectedPdf(true);\n            setSelectedPdfName(file.name);\n          }'

content = re.sub(pattern, repl, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Patched setSelectedPdfName securely")
