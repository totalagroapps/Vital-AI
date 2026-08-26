import os

with open('frontend/src/MedicalSearchModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken backticks string template
content = content.replace("'Authorization': \Bearer \\\", "'Authorization': Bearer ")
content = content.replace("\Bearer \\", "Bearer ")

with open('frontend/src/MedicalSearchModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed backticks syntax")
