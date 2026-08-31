import os

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: The background graphic (Fix from 414a815 and 62e6b64)
old_bg = '''{/* Background Graphic */}
        <div className="absolute top-0 right-0 w-full md:w-2/3 h-[500px] md:h-[700px] z-0 overflow-hidden pointer-events-none">
          <img 
            src="/images/abstract_patient_bg.jpg" 
            alt="AI Hologram" 
            className="absolute top-0 right-0 w-full h-full object-cover opacity-90 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-base" />
          <div className="absolute inset-0 bg-gradient-to-r from-base to-transparent md:w-1/3" />
        </div>'''

new_bg = '''{/* Background Graphic */}
        <div className="absolute top-0 left-0 w-full h-[650px] z-0 overflow-hidden pointer-events-none bg-base">
          <img 
            src="/images/heart_ai_patient_bg.jpg" 
            alt="AI Hologram" 
            className="absolute top-0 right-0 w-[120%] md:w-2/3 h-full object-cover object-center md:object-right-top opacity-100 mix-blend-normal"
          />
          <div className="absolute inset-0 w-full md:w-3/4 bg-gradient-to-r from-base via-base/95 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-base via-base/90 to-transparent" />
        </div>'''

content = content.replace(old_bg, new_bg)

# Fix 2: Spacing and margins (Fix from 8c46e05)
content = content.replace('className="relative z-10 px-6 pt-12"', 'className="relative z-10 px-5 pt-8"')
content = content.replace('className="mt-8 mb-10 max-w-[70%]"', 'className="mt-6 mb-6 max-w-[85%] md:max-w-[60%]"')
content = content.replace('className="text-[32px] leading-tight font-bold text-content-primary mb-4"', 'className="text-3xl leading-tight font-bold text-content-primary mb-3"')
content = content.replace('className="text-content-secondary text-sm leading-relaxed mb-6"', 'className="text-content-secondary text-sm leading-relaxed mb-5"')
content = content.replace('className="flex items-center justify-center gap-2 mb-6 mt-16"', 'className="flex items-center justify-center gap-2 mb-4 mt-8"')
content = content.replace('className="grid grid-cols-2 gap-4 mb-6"', 'className="grid grid-cols-2 gap-3 mb-6"')
content = content.replace('className="bg-white rounded-3xl p-5', 'className="bg-white rounded-3xl p-4')
content = content.replace('mb-4 relative z-10"', 'mb-3 relative z-10"')
content = content.replace('mb-2 relative z-10"', 'mb-1 relative z-10"')
content = content.replace('mb-8 relative z-10"', 'mb-6 relative z-10"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Applied all fixes safely!")
