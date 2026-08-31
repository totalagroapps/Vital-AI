import os

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add a horizontal gradient fade to the image so the left text is readable
replacement = '''<div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/80 to-base" />
          <div className="absolute inset-0 bg-gradient-to-r from-base via-base/80 to-transparent" />'''
content = content.replace('<div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/80 to-base" />', replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Added horizontal fade gradient!")
