import os
import re

file_path = 'backend/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('SYSTEM_PROMPT += "\n\nATENCION:', 'SYSTEM_PROMPT += "\\n\\nATENCION:')
content = content.replace('SYSTEM_PROMPT += "\n\\nATENCION:', 'SYSTEM_PROMPT += "\\n\\nATENCION:')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
