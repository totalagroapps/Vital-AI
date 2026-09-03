import os

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the Mic icon click behavior in the search bar
bad_mic = '''<div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 md:w-6 md:h-6 bg-brand-purple rounded-full flex items-center justify-center text-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
              <Mic size={14} />
            </div>'''
# Actually wait, my replace on PatientHome might be different. Let's find exactly what it is.
