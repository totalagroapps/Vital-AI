import os
import re

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Replace using regex to catch ANY corrupted character
content = re.sub(r'm.s f.cil', 'más fácil', content)
content = re.sub(r'acompa.arte', 'acompañarte', content)
content = re.sub(r'informaci.n siempre est. protegida', 'información siempre está protegida', content)
content = re.sub(r'est.ndares de privacidad', 'estándares de privacidad', content)
content = re.sub(r'.Qu. te gustar.a hacer hoy\?', '¿Qué te gustaría hacer hoy?', content)
content = re.sub(r'Entiende tus s.ntomas', 'Entiende tus síntomas', content)
content = re.sub(r'Cu.ntanos qu. te ocurre', 'Cuéntanos qué te ocurre', content)
content = re.sub(r'te har. preguntas y te orientar. sobre', 'te hará preguntas y te orientará sobre', content)
content = re.sub(r'pruebas m.dicas', 'pruebas médicas', content)
content = re.sub(r'anal.ticas', 'analíticas', content)
content = re.sub(r'radiograf.as', 'radiografías', content)
content = re.sub(r'Obt.n explicaciones', 'Obtén explicaciones', content)
content = re.sub(r'medicaci.n', 'medicación', content)
content = re.sub(r'Con.ctate con m.dicos', 'Conéctate con médicos', content)
content = re.sub(r'evaluaci.n o diagn.stico', 'evaluación o diagnóstico', content)

# Just in case there are multiline issues
content = re.sub(r'Entiende tus[^\w]+ntomas', 'Entiende tus síntomas', content)
content = re.sub(r's\ufffd\nntomas', 'síntomas', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Regex replaced Spanish characters!")
