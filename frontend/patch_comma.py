import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "  Server\n  Sparkles,",
    "  Server,\n  Sparkles,"
)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
