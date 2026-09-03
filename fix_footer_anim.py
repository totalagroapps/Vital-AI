import os
file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

bad_str = 'className="ai-card-gradient rounded-3xl p-5 flex items-center gap-4 text-white cursor-pointer relative overflow-hidden shadow-lg mb-4 animate-fade-in-up opacity-0" style={{ animationDelay: "550ms" }} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out'
good_str = 'className="ai-card-gradient rounded-3xl p-5 flex items-center gap-4 text-white cursor-pointer relative overflow-hidden shadow-lg mb-4 animate-fade-in-up opacity-0 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out" style={{ animationDelay: "550ms" }}'

content = content.replace(bad_str, good_str)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
