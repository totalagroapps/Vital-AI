import os

file_path = 'frontend/src/views/TriageWizard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the missing backticks
content = content.replace(
    "className={w-16 h-16 rounded-full flex items-center justify-center shadow-inner mx-4 transition-all duration-300 }",
    "className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner mx-4 transition-all duration-300 ${isListening ? 'bg-brand-purple text-white shadow-glow animate-pulse scale-110' : 'bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/20 hover:scale-105'}`}"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed backticks!")
