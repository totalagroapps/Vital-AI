import os

file_path = 'frontend/src/views/DoctorOnboarding.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I'll put submitError just above the footer buttons
target = '''        {/* Footer Navigation */}
        <div className="p-6 border-t border-gray-100 flex items-center bg-gray-50/50 rounded-b-2xl">'''

repl = '''        {/* Footer Navigation */}
        {submitError && <div className="px-6 pt-4 text-red-500 text-sm font-semibold text-center">{submitError}</div>}
        <div className="p-6 border-t border-gray-100 flex items-center bg-gray-50/50 rounded-b-2xl">'''

content = content.replace(target, repl)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added submitError to footer")
