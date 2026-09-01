import os
import re

directories = ['frontend/src', 'backend']

for directory in directories:
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.jsx', '.js', '.py', '.html', '.css', '.md')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Replace variations of Vital IA
                new_content = content.replace('Vital IA', 'VitalAI')
                new_content = new_content.replace('VitalIA', 'VitalAI')
                new_content = new_content.replace('VITAL IA', 'VITALAI')
                new_content = new_content.replace('VITALIA', 'VITALAI')
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated {filepath}")
print("Name change complete")
