import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace llama3.2-vision:latest with minicpm-v
content = content.replace('model="llama3.2-vision:latest",', 'model="minicpm-v",')

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Reverted to minicpm-v")
