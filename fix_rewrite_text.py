import os

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

import re

# Rewrite Hero
content = re.sub(
    r'<h2 className="text-2xl md:text-3xl leading-tight font-bold text-content-primary mb-1">.*?</h2>',
    '<h2 className="text-2xl md:text-3xl leading-tight font-bold text-content-primary mb-1">\n              Tu salud, más fácil de <span className="text-brand-purple">entender</span> y <span className="text-brand-purple">gestionar.</span>\n            </h2>',
    content, flags=re.DOTALL
)

content = re.sub(
    r'<p className="text-content-secondary text-sm leading-relaxed mb-3 hidden sm:block">.*?</p>',
    '<p className="text-content-secondary text-sm leading-relaxed mb-3 hidden sm:block">\n              Vital IA utiliza inteligencia artificial avanzada para acompañarte en cada paso de tu salud.\n            </p>',
    content, flags=re.DOTALL
)

content = re.sub(
    r'<div className="glass-card rounded-xl p-2.5 flex gap-2 items-center w-full max-w-sm">.*?</div>\n          </div>',
    '<div className="glass-card rounded-xl p-2.5 flex gap-2 items-center w-full max-w-sm">\n              <div className="bg-brand-purple/10 p-2 rounded-xl text-brand-purple">\n                <ShieldCheck size={20} />\n              </div>\n              <div>\n                <p className="text-[11px] font-semibold text-content-primary leading-tight">Tu información siempre está protegida</p>\n                <p className="text-[9px] text-content-secondary mt-0.5 leading-tight hidden sm:block">Cumplimos con los más altos estándares de privacidad.</p>\n              </div>\n            </div>\n          </div>',
    content, flags=re.DOTALL
)

# Rewrite Title
content = re.sub(
    r'<h3 className="text-lg md:text-xl font-bold text-center text-gray-900">.*?</h3>',
    '<h3 className="text-lg md:text-xl font-bold text-center text-gray-900">¿Qué te gustaría hacer hoy?</h3>',
    content, flags=re.DOTALL
)

# Rewrite Card 1
content = re.sub(
    r'<h4 className="font-bold text-gray-900 text-xs md:text-base mb-1 relative z-10">.*?</h4>\n\s*<p className="text-\[11px\] text-gray-500 leading-relaxed mb-6 relative z-10 hidden sm:block">.*?</p>',
    '<h4 className="font-bold text-gray-900 text-xs md:text-base mb-1 relative z-10">Entiende tus síntomas</h4>\n              <p className="text-[11px] text-gray-500 leading-relaxed mb-6 relative z-10 hidden sm:block">\n                Cuéntanos qué te ocurre. Vital IA te hará preguntas y te orientará sobre los siguientes pasos.\n              </p>',
    content, flags=re.DOTALL
)

# Rewrite Card 2
content = re.sub(
    r'<h4 className="font-bold text-gray-900 mb-1 relative z-10">.*?</h4>\n\s*<p className="text-\[11px\] text-gray-500 leading-relaxed mb-6 relative z-10 hidden sm:block">.*?</p>',
    '<h4 className="font-bold text-gray-900 mb-1 relative z-10">Analiza tus pruebas médicas</h4>\n              <p className="text-[11px] text-gray-500 leading-relaxed mb-6 relative z-10 hidden sm:block">\n                Sube analíticas, informes, radiografías, TAC y más. Obtén explicaciones claras y comprensibles.\n              </p>',
    content, flags=re.DOTALL
)

# Rewrite Card 3
content = re.sub(
    r'<h4 className="font-bold text-gray-900 mb-1 relative z-10">.*?</h4>\n\s*<p className="text-\[11px\] text-gray-500 leading-relaxed mb-6 relative z-10 hidden sm:block">.*?</p>',
    '<h4 className="font-bold text-gray-900 mb-1 relative z-10">Organiza tu historial de salud</h4>\n              <p className="text-[11px] text-gray-500 leading-relaxed mb-6 relative z-10 hidden sm:block">\n                Guarda y organiza todos tus documentos, medicación, alergias, enfermedades y mucho más en un solo lugar.\n              </p>',
    content, flags=re.DOTALL
)

# Rewrite Card 4
content = re.sub(
    r'<h4 className="font-bold text-gray-900 mb-1 relative z-10">.*?</h4>\n\s*<p className="text-\[11px\] text-gray-500 leading-relaxed mb-6 relative z-10 hidden sm:block">.*?</p>',
    '<h4 className="font-bold text-gray-900 mb-1 relative z-10">Conéctate con médicos especialistas</h4>\n              <p className="text-[11px] text-gray-500 leading-relaxed mb-6 relative z-10 hidden sm:block">\n                Encuentra al especialista adecuado, pide cita, realiza videollamadas y comparte tu información de forma segura.\n              </p>',
    content, flags=re.DOTALL
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Rewrote all text completely!")
