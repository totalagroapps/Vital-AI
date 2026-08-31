import os

files = ['frontend/src/views/TriageWizard.jsx', 'frontend/src/views/DocumentAnalyzer.jsx']

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace broken image path
    content = content.replace('/images/ai_patient_bg.jpg', '/images/abstract_woman_bg.jpg')
    content = content.replace('/images/abstract_patient_bg.jpg', '/images/abstract_woman_bg.jpg')
    
    # Also apply the mask-image trick to make it look great on desktop
    content = content.replace(
        'className="absolute top-0 right-0 w-full md:w-2/3 h-full object-cover opacity-90 mix-blend-screen"',
        'className="absolute top-0 right-0 w-[85%] md:w-[60%] lg:w-[50%] h-[400px] md:h-full object-cover opacity-90" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 40%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 40%)" }}'
    )
    content = content.replace(
        'className="absolute top-0 right-0 w-full h-full object-cover opacity-90 mix-blend-screen"',
        'className="absolute top-0 right-0 w-[85%] md:w-[60%] lg:w-[50%] h-[400px] md:h-full object-cover opacity-90" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 40%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 40%)" }}'
    )

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed broken images!")
