import os

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the whole background section
import re
new_bg = '''{/* Background Graphic */}
        <div className="absolute top-0 left-0 w-full h-[650px] z-0 overflow-hidden pointer-events-none bg-base">
          {/* We position the dark image on the right side */}
          <img 
            src="/images/dark_ai_patient_bg.jpg" 
            alt="AI Hologram" 
            className="absolute top-0 right-0 w-[120%] md:w-2/3 h-full object-cover object-center md:object-right-top opacity-100 mix-blend-normal"
          />
          {/* Horizontal fade to white (base) to cover the left side of the image */}
          <div className="absolute inset-0 w-full md:w-3/4 bg-gradient-to-r from-base via-base/95 to-transparent" />
          
          {/* Vertical fade to white (base) to seamlessly blend the bottom edge into the page */}
          <div className="absolute bottom-0 left-0 w-full h-48 bg-gradient-to-t from-base via-base/90 to-transparent" />
        </div>'''

content = re.sub(r'\{\/\* Background Graphic \*\/\}.*?<\/div>\n        <\/div>', new_bg + '\n', content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated PatientHome background with heavy fades!")
