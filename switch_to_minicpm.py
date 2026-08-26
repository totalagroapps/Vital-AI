import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace llava with minicpm-v
content = content.replace('model="llava",', 'model="minicpm-v",')
content = content.replace('Enviando imagen a llava', 'Enviando imagen a minicpm-v')

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Switched vision model back to minicpm-v")
