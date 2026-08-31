import os
import re

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Entiende tus" in line:
        # The button is a few lines above this
        # Let's just find the button tag
        for j in range(i, -1, -1):
            if "<button onClick" in lines[j]:
                lines[j] = lines[j].replace("onNavigate('general_chat')", "onNavigate('triage')")
                break

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("Fixed PatientHome.jsx button!")
