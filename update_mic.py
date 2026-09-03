import os

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_mic = '''<div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-brand-purple rounded-full flex items-center justify-center text-white shadow-sm cursor-pointer hover:scale-105 transition-transform">
              <Mic size={12} />
            </div>'''

good_mic = '''<div 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-brand-purple rounded-full flex items-center justify-center text-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                localStorage.setItem('autoStartMic', 'true');
                onNavigate('triage');
              }}
            >
              <Mic size={12} />
            </div>'''

content = content.replace(bad_mic, good_mic)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated PatientHome Mic button!")
