import os

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
inserted = False
for line in lines:
    new_lines.append(line)
    if 'O-</option>' in line and not inserted:
        # We found the line. Add the next two lines from original first.
        pass # Wait, it's easier to track by index

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if '<option value="O+">O+</option><option value="O-">O-</option>' in line:
        insert_idx = i + 3
        # Insert fields
        new_block = [
            '                <div className="grid grid-cols-2 gap-4 mt-4">\n',
            '                  <div>\n',
            '                    <label className="block text-xs font-medium text-slate-600 mb-1">Altura (cm)</label>\n',
            '                    <input type="text" value={patientProfile.height || ""} onChange={e => setPatientProfile({...patientProfile, height: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-cyan-500" placeholder="Ej. 175" />\n',
            '                  </div>\n',
            '                  <div>\n',
            '                    <label className="block text-xs font-medium text-slate-600 mb-1">Peso (kg)</label>\n',
            '                    <input type="text" value={patientProfile.weight || ""} onChange={e => setPatientProfile({...patientProfile, weight: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-cyan-500" placeholder="Ej. 70" />\n',
            '                  </div>\n',
            '                </div>\n'
        ]
        lines = lines[:insert_idx] + new_block + lines[insert_idx:]
        with open('frontend/src/App.jsx', 'w', encoding='utf-8') as fw:
            fw.writelines(lines)
        print("Successfully injected using array insertion!")
        break
