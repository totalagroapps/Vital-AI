import os

with open('frontend/src/MedicalSearchModal.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'Authorization' in line:
        lines[i] = "          'Authorization': Bearer \n"
        break

with open('frontend/src/MedicalSearchModal.jsx', 'w', encoding='utf-8') as f:
    f.writelines(lines)
