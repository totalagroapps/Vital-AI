import os
file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add LogOut to imports
content = content.replace("ShieldCheck, ArrowRight, Sparkles", "ShieldCheck, ArrowRight, Sparkles, LogOut")

# Add onLogout prop
content = content.replace("const PatientHome = ({ onNavigate }) => {", "const PatientHome = ({ onNavigate, onLogout }) => {")

# Replace header button with logout
old_header_btn = '''<button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white/50 backdrop-blur">
            <ShieldCheck className="text-gray-600" size={20} />
          </button>'''

new_header_btn = '''<div className="flex gap-2">
            <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white/50 backdrop-blur">
              <ShieldCheck className="text-gray-600" size={20} />
            </button>
            <button onClick={onLogout} className="w-10 h-10 rounded-full border border-red-200 flex items-center justify-center bg-red-50 backdrop-blur" title="Cerrar sesión">
              <LogOut className="text-red-500" size={18} />
            </button>
          </div>'''

content = content.replace(old_header_btn, new_header_btn)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("PatientHome patched!")
