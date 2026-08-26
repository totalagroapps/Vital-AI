import re

with open('frontend/src/Auth.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '<div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4 relative overflow-hidden">',
    '<div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4 relative overflow-hidden">\n        <LanguageSelector />'
)

content = content.replace(
    '<div className={lex h-screen w-full items-center justify-center bg-slate-100  relative overflow-hidden transition-colors duration-1000}>',
    '<div className={lex h-screen w-full items-center justify-center bg-slate-100  relative overflow-hidden transition-colors duration-1000}>\n        <LanguageSelector />'
)

with open('frontend/src/Auth.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
