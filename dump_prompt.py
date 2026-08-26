import os
import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'TRIAGE_SYSTEM_PROMPT_V2 = \"\"\"(.*?)\"\"\"', content, re.DOTALL)
if match:
    with open('dump.txt', 'w', encoding='utf-8') as f:
        f.write(match.group(1))
