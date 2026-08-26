import os
import re

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'Menu,' not in content:
    content = content.replace("    BookOpen,", "    BookOpen,\n    Menu,")

old_btn = '''            {/* Attach Buttons */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}'''

new_btn = '''            {/* Attach Buttons */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              title="Abrir Menú"
              className="md:hidden p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm text-slate-600 hover:text-cyan-400 hover:border-slate-300 transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}'''

if 'title="Abrir Menú"' not in content:
    content = content.replace(old_btn, new_btn)
    with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Injected mobile menu button")
else:
    print("Already injected")
