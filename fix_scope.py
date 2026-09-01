import re

file_path = 'backend/main.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the rogue "from openai import AsyncOpenAI" inside the auto-profiling block
# It has extra leading whitespace since it's inside function body
content = content.replace('            import json\n            import os\n            from openai import AsyncOpenAI\n            \n            try:', '            import json\n            import os\n            \n            try:')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Removed rogue import")
