import os

file_path = 'frontend/src/views/TriageWizard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_left_wave = '''<div className="w-1 bg-current rounded-full" style={{ height: h * 4 + 'px' }} />'''
good_left_wave = '''<div key={i} className={w-1 bg-current rounded-full transition-all duration-300 } style={{ height: (isListening ? h * 6 : h * 4) + 'px' }} />'''

# Only replace the first occurrence (which is the left waveform, as the right one was already replaced by regex)
content = content.replace(bad_left_wave, good_left_wave, 1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated left waveform!")
