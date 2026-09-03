import os
import re

file_path = 'frontend/src/views/TriageWizard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the missing backticks for waveforms
content = content.replace(
    "className={w-1 bg-current rounded-full transition-all duration-300 }",
    "className={`w-1 bg-current rounded-full transition-all duration-300 ${isListening ? 'animate-pulse' : ''}`}"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed waveform backticks!")
