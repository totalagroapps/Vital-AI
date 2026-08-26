import os
import glob

def replace_in_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        if 'VitalIA' in content or 'VitalIA' in content:
            new_content = content.replace('VitalIA', 'VitalIA').replace('VitalIA', 'VitalIA')
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {filepath}")
    except Exception as e:
        pass

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or '__pycache__' in root or '.venv' in root:
        continue
    for file in files:
        if file.endswith(('.js', '.jsx', '.html', '.json', '.py', '.md')):
            replace_in_file(os.path.join(root, file))
