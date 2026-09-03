import os

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Background Graphic (Desktop fix + Robot image)
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
      <div className="absolute top-0 right-0 w-full md:w-[60%] lg:w-[45%] h-[500px] md:h-[800px] z-0 overflow-hidden pointer-events-none">
        <img 
          src="/images/brain_robot_bg.jpg" 
          alt="AI Hologram" 
          className="absolute top-0 right-0 w-full h-full object-cover object-top md:object-right-top"
        />
        {/* Fade the left edge of the image to perfectly blend into the white background */}
        <div className="absolute inset-0 w-full bg-gradient-to-r from-base via-base/70 to-transparent" />
        {/* Fade the bottom edge of the image to seamlessly disappear */}
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-base via-base/80 to-transparent" />
        {/* Cover any harsh lines on the far left */}
        <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-base to-transparent" />
      </div>'''

content = content.replace(old_bg, new_bg)

# 2. Main Spacing
content = content.replace('className="relative z-10 px-6 pt-12"', 'className="relative z-10 px-4 pt-3"')
content = content.replace('className="flex justify-between items-center mb-8"', 'className="flex justify-between items-center mb-2"')

# 3. Hero Section & Text (Using regex for safe replacement without touching Spanish characters directly)
import re
# Remove <br /> from Tu salud
content = re.sub(r'Tu salud, <br />\s*más fácil de <br />\s*<span className="text-brand-purple">entender</span> y <br />\s*<span className="text-brand-purple">gestionar\.</span>',
                 r'Tu salud, más fácil de <span className="text-brand-purple">entender</span> y <span className="text-brand-purple">gestionar.</span>', content)

content = content.replace('className="mt-8 mb-10 max-w-[70%]"', 'className="mt-2 mb-3 max-w-full md:max-w-[70%]"')
content = content.replace('className="text-[32px] leading-tight font-bold text-content-primary mb-4"', 'className="text-2xl md:text-3xl leading-tight font-bold text-content-primary mb-1"')
content = content.replace('className="text-content-secondary text-sm leading-relaxed mb-6"', 'className="text-content-secondary text-sm leading-relaxed mb-3 hidden sm:block"')

# Privacy Card
content = content.replace('className="glass-card rounded-2xl p-4 flex gap-3 items-center w-full max-w-sm"', 'className="glass-card rounded-xl p-2.5 flex gap-2 items-center w-full max-w-sm"')
content = content.replace('className="text-xs font-semibold text-content-primary"', 'className="text-[11px] font-semibold text-content-primary leading-tight"')
content = content.replace('className="text-[10px] text-content-secondary mt-0.5"', 'className="text-[9px] text-content-secondary mt-0.5 leading-tight hidden sm:block"')

# Title
content = content.replace('className="flex items-center justify-center gap-2 mb-6 mt-16"', 'className="flex items-center justify-center gap-2 mb-2 mt-3"')
content = content.replace('className="text-xl font-bold text-center"', 'className="text-lg md:text-xl font-bold text-center text-gray-900"')

# Grid
content = content.replace('className="grid grid-cols-2 gap-4 mb-6"', 'className="grid grid-cols-2 gap-2 md:gap-3 mb-4"')

# Cards
content = content.replace('className="text-[11px] text-gray-500 leading-relaxed mb-6 relative z-10"', 'className="text-[11px] text-gray-500 leading-relaxed mb-6 relative z-10 hidden sm:block"')
content = content.replace('className="bg-white rounded-3xl p-5', 'className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-4')
content = content.replace('mb-4 relative z-10"', 'mb-1 md:mb-3 relative z-10"')
content = content.replace('w-12 h-12', 'w-8 h-8 md:w-12 md:h-12')
content = content.replace('text-[10px] font-bold px-2 py-1', 'text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 md:py-1')
content = content.replace('<h4 className="font-bold text-gray-900 mb-1 relative z-10">', '<h4 className="font-bold text-gray-900 text-xs md:text-base mb-1 relative z-10">')
content = content.replace('bottom-4 right-4', 'bottom-2 right-2 md:bottom-4 md:right-4')
content = content.replace('w-8 h-8', 'w-6 h-6 md:w-8 md:h-8')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Applied all fixes perfectly without corrupting Spanish characters!")
