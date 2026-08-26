import os
import glob
import re

files = glob.glob('frontend/src/**/*.jsx', recursive=True)

# Define exact replacements to sanitize the UI
replacements = [
    (r'\bbg-cyan-50\b', 'bg-semantic-info-bg'),
    (r'\bbg-cyan-[1-9]00\b', 'bg-brand'),
    (r'\bhover:bg-cyan-[1-9]00\b', 'hover:bg-brand-hover'),
    (r'\btext-cyan-[1-9]00\b', 'text-brand'),
    (r'\bborder-cyan-[1-9]00\b', 'border-brand/30'),
    (r'\bfrom-cyan-[0-9]+ to-(sky|blue)-[0-9]+\b', 'bg-surface border border-border-subtle'),
    
    (r'\bbg-emerald-50\b', 'bg-semantic-success-bg'),
    (r'\bbg-emerald-[1-9]00\b', 'bg-semantic-success-bg'),
    (r'\bhover:bg-emerald-[1-9]00\b', 'hover:bg-semantic-success-bg'),
    (r'\btext-emerald-[1-9]00\b', 'text-semantic-success-text'),
    (r'\bborder-emerald-[1-9]00\b', 'border-semantic-success-text/20'),
    
    (r'\bbg-teal-[0-9]00\b', 'bg-semantic-info-bg'),
    (r'\btext-teal-[0-9]00\b', 'text-semantic-info-text'),
    
    (r'\bbg-rose-[1-9]00\b', 'bg-semantic-danger-bg'),
    (r'\btext-rose-[1-9]00\b', 'text-semantic-danger-text'),
    (r'\bborder-rose-[1-9]00\b', 'border-semantic-danger-text/20'),
    
    (r'\bbg-indigo-600\b', 'bg-brand'),
    (r'\bhover:bg-indigo-[7-9]00\b', 'hover:bg-brand-hover'),
    
    (r'\bbg-fuchsia-[1-9]00\b', 'bg-brand'),
    (r'\btext-fuchsia-[1-9]00\b', 'text-brand'),
    (r'\bhover:text-fuchsia-[1-9]00\b', 'hover:text-brand'),
    
    (r'\bshadow-cyan-[0-9]+(/[0-9]+)?\b', 'shadow-sm'),
    (r'\bshadow-emerald-[0-9]+(/[0-9]+)?\b', 'shadow-sm'),
    
    # Also catch cases where bg-emerald-600 hover:bg-semantic-success-bg was created
    (r'\bbg-semantic-success-bg text-white\b', 'bg-semantic-success-bg text-semantic-success-text'),
    (r'\bbg-brand text-white\b', 'bg-brand text-white')
]

modified_files = []

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
        
    # Manual cleanups for badges if any
    content = content.replace('bg-semantic-success-bg text-white', 'bg-semantic-success-bg text-semantic-success-text')
    content = content.replace('bg-semantic-info-bg text-white', 'bg-semantic-info-bg text-semantic-info-text')
        
    if content != original:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        modified_files.append(file)

print("MODIFIED FILES:")
for f in modified_files:
    print(f"- {f}")
