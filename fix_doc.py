import os

file_path = 'frontend/src/views/DocumentAnalyzer.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import { ArrowLeft, MoreHorizontal, ShieldCheck, CloudUpload, FileText, Image as ImageIcon, Activity, Beaker, FileSearch, Sparkles, MessageSquareText } from 'lucide-react';",
    "import { ArrowLeft, ArrowRight, MoreHorizontal, ShieldCheck, CloudUpload, FileText, Image as ImageIcon, Activity, Beaker, FileSearch, Sparkles, MessageSquareText } from 'lucide-react';"
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed DocumentAnalyzer.jsx imports")
