import os

with open('frontend/src/DoctorDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_dash = '''                    <div><span className="text-slate-600 block text-xs">Sangre</span><span className="font-medium text-rose-400">{patientDetail.profile.blood_type}</span></div>
                    <div className="col-span-2"><span className="text-slate-600 block text-xs">Alergias</span><span className="font-medium">{patientDetail.profile.allergies || 'Ninguna'}</span></div>'''

new_dash = '''                    <div><span className="text-slate-600 block text-xs">Sangre</span><span className="font-medium text-rose-400">{patientDetail.profile.blood_type}</span></div>
                    <div><span className="text-slate-600 block text-xs">Altura</span><span className="font-medium">{patientDetail.profile.height ? ${patientDetail.profile.height} cm : 'N/D'}</span></div>
                    <div><span className="text-slate-600 block text-xs">Peso</span><span className="font-medium">{patientDetail.profile.weight ? ${patientDetail.profile.weight} kg : 'N/D'}</span></div>
                    <div className="col-span-2"><span className="text-slate-600 block text-xs">Alergias</span><span className="font-medium">{patientDetail.profile.allergies || 'Ninguna'}</span></div>'''

if 'Altura' not in content:
    content = content.replace(old_dash, new_dash)
    with open('frontend/src/DoctorDashboard.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("DoctorDashboard.jsx patched")
else:
    print("Already patched")
