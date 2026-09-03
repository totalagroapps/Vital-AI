import os
import re

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

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

# Safe regex replacement that ONLY targets the div immediately following the comment
content = re.sub(r'\{\/\* Background Graphic \*\/.*?<\/div>', new_bg, content, count=1, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated desktop background rendering with safe regex!")
