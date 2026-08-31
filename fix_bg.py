import os
file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix image fading
bad_bg = '''      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-full md:w-[60%] lg:w-[45%] h-[500px] md:h-[800px] z-0 overflow-hidden pointer-events-none animate-float-slow">
        <img 
          src="/images/abstract_woman_bg.jpg" 
          alt="AI Hologram" 
          className="absolute top-0 right-0 w-full h-full object-cover object-top md:object-right-top"
        />
        <div className="absolute inset-0 w-full bg-gradient-to-r from-base via-base/70 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-base via-base/80 to-transparent" />
        <div className="absolute top-0 left-0 w-16 h-full bg-gradient-to-r from-base to-transparent" />
      </div>'''

good_bg = '''      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-full md:w-[60%] lg:w-[50%] h-[500px] md:h-[800px] z-0 overflow-hidden pointer-events-none animate-float-slow">
        <img 
          src="/images/abstract_woman_bg.jpg" 
          alt="AI Hologram" 
          className="absolute top-0 right-0 w-full h-full object-cover object-top md:object-right-top opacity-90"
          style={{ maskImage: 'linear-gradient(to right, transparent, black 15%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%)' }}
        />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-base to-transparent" />
      </div>'''

content = content.replace(bad_bg, good_bg)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed background fading!")
