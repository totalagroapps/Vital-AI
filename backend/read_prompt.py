import os
import re

with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'TRIAGE_SYSTEM_PROMPT_V2 = \"\"\"(.*?)\"\"\"', content, re.DOTALL)
if match:
    print(match.group(1))
