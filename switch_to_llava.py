import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace minicpm-v with llava
content = content.replace('model="minicpm-v",', 'model="llava",')
content = content.replace('Enviando imagen a minicpm-v', 'Enviando imagen a llava')

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Switched vision model to llava")
