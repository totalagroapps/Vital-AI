import os

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix corrupted Spanish characters
replacements = {
    'mǭs': 'más',
    'fǭcil': 'fácil',
    'acompaarte': 'acompañarte',
    'informacin': 'información',
    'estǭ': 'está',
    'estǭndares': 'estándares',
    'QuǸ': '¿Qué',
    'gustara': 'gustaría',
    'sntomas': 'síntomas',
    'CuǸntanos': 'Cuéntanos',
    'quǸ': 'qué',
    'harǭ': 'hará',
    'orientarǭ': 'orientará',
    'mǸdicas': 'médicas',
    'analticas': 'analíticas',
    'radiografas': 'radiografías',
    'ObtǸn': 'Obtén',
    'medicacin': 'medicación',
    'mǸdicos': 'médicos',
    'ConǸctate': 'Conéctate',
    'evaluacin': 'evaluación',
    'diagnstico': 'diagnóstico'
}

for bad, good in replacements.items():
    content = content.replace(bad, good)

# Also fix the weird line breaks if any
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed Spanish characters!")
