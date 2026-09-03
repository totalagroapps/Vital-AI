import os
import re

file_path = "frontend/src/DoctorDashboard.jsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Just use regex to fix all className={ missing backticks
content = re.sub(r"className=\{([a-zA-Z0-9\-\[\]\s:]+)\s*\+", r"className={`\1 ` +", content)
content = re.sub(r"className=\{prose prose-sm(.*?)\}>", r"className={`prose prose-sm\1`}>", content)
content = re.sub(r"className=\{flex \$\{(.*?)\}\}>", r"className={`flex ${\1}`}>", content)
content = re.sub(r"className=\{max-w-\[90%\](.*?)\$\{(.*?)\n(.*?)\}\}>", r"className={`max-w-[90%]\1${\2\n\3}`}>", content)
content = re.sub(r"text-\[10px\] px-3 py-1 rounded-full uppercase font-bold tracking-wide \$\{", r"`text-[10px] px-3 py-1 rounded-full uppercase font-bold tracking-wide ${", content)
content = re.sub(r"bg-gray-100 text-gray-600\\n\s*\}\>", r"bg-gray-100 text-gray-600\n                            }`>", content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Regex backticks fixed!")
