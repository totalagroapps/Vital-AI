import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<div className="flex h-screen bg-slate-50 font-sans overflow-hidden">',
    '<div className="flex h-screen bg-slate-50 font-sans overflow-hidden">\n      <LanguageSelector />'
)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

with open('frontend/src/Auth.jsx', 'r', encoding='utf-8') as f:
    auth_content = f.read()

auth_content = auth_content.replace(
    '<div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">',
    '<div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">\n      <LanguageSelector />'
)

with open('frontend/src/Auth.jsx', 'w', encoding='utf-8') as f:
    f.write(auth_content)
