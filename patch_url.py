import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all occurrences of os.getenv("OLLAMA_HOST", "...") with the new cloudflare URL
content = re.sub(
    r'os\.getenv\("OLLAMA_HOST", ".*?"\)',
    'os.getenv("OLLAMA_HOST", "https://myers-groundwater-enters-digital.trycloudflare.com")',
    content
)

# Fix the broken OLLAMA_URL mentions
content = content.replace(
    'client = ollama.AsyncClient(host=OLLAMA_URL)',
    'client = ollama.AsyncClient(host=os.getenv("OLLAMA_HOST", "https://myers-groundwater-enters-digital.trycloudflare.com"))'
)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
