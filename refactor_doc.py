import os
import re

with open('frontend/src/DoctorDashboard.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Apply same rules to DoctorDashboard
code = code.replace('bg-slate-50 text-slate-900', 'bg-base text-content-primary')
code = code.replace('bg-cyan-950', 'bg-surface border-r border-border-subtle')
code = code.replace('border-cyan-800/50', 'border-border-subtle')
code = code.replace('text-cyan-400', 'text-brand')
code = code.replace('text-cyan-50', 'text-content-primary')
code = code.replace('text-cyan-100', 'text-content-secondary')
code = code.replace('hover:bg-cyan-800/50', 'hover:bg-base hover:text-content-primary')
code = code.replace('bg-cyan-950/40 border-cyan-500/40 text-cyan-200', 'bg-semantic-info-bg border-semantic-info-text/20 text-semantic-info-text font-medium')

# 2. Main CTA Button
code = code.replace('bg-cyan-500 hover:bg-cyan-400 text-white font-bold', 'bg-brand hover:bg-brand-hover text-white font-semibold')
code = code.replace('shadow-cyan-500/20', 'shadow-sm')

# 3. Badges in header
code = code.replace('bg-emerald-500 text-white', 'bg-semantic-success-bg text-semantic-success-text')
code = code.replace('text-emerald-700 bg-emerald-50 border border-emerald-200', 'text-semantic-success-text bg-semantic-success-bg border-none font-medium')
code = code.replace('bg-cyan-500 text-white', 'bg-semantic-info-bg text-semantic-info-text')
code = code.replace('bg-teal-500 text-white', 'bg-semantic-info-bg text-semantic-info-text')

with open('frontend/src/DoctorDashboard.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Applied UI fixes to DoctorDashboard.jsx")
