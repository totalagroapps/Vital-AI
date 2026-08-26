import os

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace h-screen with h-[100dvh] to fix mobile browser URL bar clipping
if 'h-screen' in content:
    content = content.replace('className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden"', 'className="flex h-[100dvh] bg-slate-50 text-slate-900 overflow-hidden"')
    with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed mobile viewport height")
else:
    print("Already fixed")
