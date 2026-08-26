import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace minicpm-v with llama3.2-vision
content = content.replace('model="minicpm-v",', 'model="llama3.2-vision:latest",')

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated vision model to llama3.2-vision:latest")
