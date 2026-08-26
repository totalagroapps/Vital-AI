import os

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("full_name: '', date_of_birth: '', gender: '', blood_type: '', height: '', weight: '', height: '', weight: '',", "full_name: '', date_of_birth: '', gender: '', blood_type: '', height: '', weight: '',")

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
