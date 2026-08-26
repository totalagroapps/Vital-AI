import re

with open('frontend/src/Auth.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<LanguageSelector />',
    '<LanguageSelector variant="floating" />'
)

with open('frontend/src/Auth.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
