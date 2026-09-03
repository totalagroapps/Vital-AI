import os

file_path = 'frontend/src/App.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

lines = content.split('\n')
for i, line in enumerate(lines):
    if "setSelectedPdfFile(file);" in line and "setSelectedPdf(true);" in lines[i+1]:
        lines[i+1] = "            setSelectedPdf(true);\n            setSelectedPdfName(file.name);"

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
print("Patched setSelectedPdfName in DocumentAnalyzer")
