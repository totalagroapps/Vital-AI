import re

with open('frontend/src/components/LanguageSelector.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'className="absolute top-4 right-4 flex items-center gap-2 z-50"',
    'className="absolute bottom-4 right-4 flex flex-col items-center gap-2 z-50"'
)

with open('frontend/src/components/LanguageSelector.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
