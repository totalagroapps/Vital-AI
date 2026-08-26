import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "} from 'lucide-react';",
    "  Sparkles,\n} from 'lucide-react';"
)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
