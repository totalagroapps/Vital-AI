import os

filepath = 'backend/requirements.txt'

# Read as raw bytes to handle the UTF-16LE append
with open(filepath, 'rb') as f:
    raw_bytes = f.read()

# The file likely has a mix of UTF-8 and UTF-16LE now.
# Let's just read it, decode it properly, and write it back as pure UTF-8.
try:
    content = raw_bytes.decode('utf-8', errors='ignore')
    # Let's clean up any weird null bytes
    content = content.replace('\x00', '')
except Exception as e:
    content = str(raw_bytes)

# Ensure xmltodict is properly formatted
lines = content.splitlines()
cleaned_lines = []
for line in lines:
    line = line.strip()
    if line:
        cleaned_lines.append(line)

# Ensure xmltodict==0.13.0 is there
if 'xmltodict==0.13.0' not in cleaned_lines:
    cleaned_lines.append('xmltodict==0.13.0')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write('\n'.join(cleaned_lines) + '\n')
