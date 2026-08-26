import os

with open('frontend/src/MedicalSearchModal.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'bg-brand text-brand text-[10px]',
    'bg-semantic-info-bg text-semantic-info-text text-[10px]'
)
content = content.replace(
    'bg-gradient-to-tr from-fuchsia-600 to-purple-500',
    'bg-brand'
)
content = content.replace(
    'focus:border-fuchsia-500 focus:ring-4 focus:ring-fuchsia-500/10',
    'focus:border-brand focus:ring-4 focus:ring-brand/10'
)
content = content.replace(
    'hover:border-fuchsia-200',
    'hover:border-brand/30'
)
content = content.replace(
    'rounded-full bg-brand flex items-center justify-center animate-pulse',
    'rounded-full bg-semantic-info-bg flex items-center justify-center animate-pulse'
)

with open('frontend/src/MedicalSearchModal.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
