with open('frontend/src/views/TriageWizard.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'step ===' in line or 'step ==' in line:
        print(f"Line {i}: {line.strip()}")
