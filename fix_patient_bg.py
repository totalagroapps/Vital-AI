import os

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_bg = '''{/* Background Graphic */}
        <div className="absolute top-0 right-0 w-full h-[600px] z-0 overflow-hidden pointer-events-none">
          <img 
            src="/images/abstract_patient_bg.jpg" 
            alt="AI Hologram" 
            className="absolute top-0 right-0 w-full h-full object-cover opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-base/80 to-base" />
          <div className="absolute inset-0 bg-gradient-to-r from-base via-base/80 to-transparent" />
        </div>'''

new_bg = '''{/* Background Graphic */}
        <div className="absolute top-0 right-0 w-full md:w-2/3 h-[500px] md:h-[700px] z-0 overflow-hidden pointer-events-none">
          <img 
            src="/images/abstract_patient_bg.jpg" 
            alt="AI Hologram" 
            className="absolute top-0 right-0 w-full h-full object-cover opacity-90 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-base" />
          <div className="absolute inset-0 bg-gradient-to-r from-base to-transparent md:w-1/3" />
        </div>'''

content = content.replace(old_bg, new_bg)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("PatientHome updated!")
