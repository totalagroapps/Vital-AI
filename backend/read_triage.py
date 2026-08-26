import os
import re

with open('main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find "INFORME DE TRIAGE"
start = content.find('INFORME DE TRIAGE')
if start != -1:
    end = content.find('"""', start)
    print(content[start:end].encode('unicode_escape').decode('utf-8'))
