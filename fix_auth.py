import re

with open('frontend/src/Auth.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '''className={w-full bg-slate-100/50 border border-slate-300 rounded-2xl py-3 pl-11 pr-4 text-slate-800 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-500 }''',
    '''className={\w-full bg-slate-100/50 border border-slate-300 rounded-2xl py-3 pl-11 pr-4 text-slate-800 focus:outline-none focus:ring-1 transition-all placeholder:text-slate-500 \\}'''
)

with open('frontend/src/Auth.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
