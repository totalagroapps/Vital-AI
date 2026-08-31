with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if 'if (patientScreen ===' in line:
            print(f"{i+1}: {line.strip()}")
