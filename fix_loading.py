import os

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'bg-gradient-to-tr from-cyan-500/20 to-sky-500/20 border border-brand/30/30 flex items-center justify-center shadow-xl shadow-sm',
    'bg-semantic-info-bg border border-border-subtle flex items-center justify-center shadow-sm'
)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
