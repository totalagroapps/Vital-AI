import os

files = ['frontend/src/App.jsx', 'frontend/src/DoctorDashboard.jsx', 'frontend/src/Auth.jsx']

for file in files:
    if not os.path.exists(file):
        continue
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix Nueva Consulta Button
    content = content.replace(
        'w-full py-2.5 px-4 rounded-xl bg-gradient-to-r bg-surface border border-border-subtle hover:from-cyan-500 hover:to-sky-400 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]',
        'w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]'
    )
    # Another variant just in case
    content = content.replace(
        'w-full py-2.5 bg-brand hover:bg-cyan-700 text-white font-medium',
        'w-full py-2.5 bg-brand hover:bg-brand-hover text-white font-medium'
    )
    
    # Fix Logo Icon Box
    content = content.replace(
        'w-10 h-10 rounded-xl bg-gradient-to-tr bg-surface border border-border-subtle flex items-center justify-center shadow-lg shadow-sm',
        'w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-sm'
    )
    
    content = content.replace(
        '<h1 className="font-bold text-lg leading-none gradient-text">VitalIA</h1>',
        '<h1 className="font-bold text-lg leading-none text-brand">VitalIA</h1>'
    )
    
    content = content.replace(
        '<span className="bg-clip-text text-transparent bg-surface border border-border-subtle">',
        '<span className="text-brand">'
    )
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Fixed mangled classes")
