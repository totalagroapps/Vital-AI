import os
import re

file_path = 'frontend/src/views/PatientChat.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

outer_pattern = r'<div className="flex flex-col h-\[100dvh\] bg-base font-sans overflow-hidden relative">'
new_outer = r'<div className="flex h-[100dvh] bg-base font-sans overflow-hidden relative">\n      <div className="flex-1 flex flex-col h-full relative border-r border-gray-200">'

content = re.sub(outer_pattern, new_outer, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed outer div")
