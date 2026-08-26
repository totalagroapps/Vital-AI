import os

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update state initialization
state_old = "full_name: '', date_of_birth: '', gender: '', blood_type: '',"
state_new = "full_name: '', date_of_birth: '', gender: '', blood_type: '', height: '', weight: '',"
content = content.replace(state_old, state_new)

# 2. Add input fields in the form
form_old = '''                      </select>
                    </div>
                  </div>'''
form_new = '''                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Altura (cm)</label>
                      <input type="text" value={patientProfile.height || ''} onChange={e => setPatientProfile({...patientProfile, height: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-cyan-500" placeholder="Ej. 175" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Peso (kg)</label>
                      <input type="text" value={patientProfile.weight || ''} onChange={e => setPatientProfile({...patientProfile, weight: e.target.value})} className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-sm text-slate-800 focus:border-cyan-500" placeholder="Ej. 70" />
                    </div>
                  </div>'''
if 'Altura (cm)' not in content:
    content = content.replace(form_old, form_new)

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("App.jsx patched")
