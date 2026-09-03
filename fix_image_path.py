import os
file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('/images/brain_robot_bg.jpg', '/images/abstract_woman_bg.jpg')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
