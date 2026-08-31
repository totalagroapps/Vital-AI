import os
import re

file_path = 'backend/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('models.PatientProfile.user_id == current_user_id', 'models.PatientProfile.user_id == t_session.user_id')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed user_id bug in triage!")
