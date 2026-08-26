import os
import re

with open('frontend/src/Auth.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix role selection screen
content = re.sub(
    r'<div className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 to-pink-400 flex items-center justify-center shadow-lg shadow-rose-500/20 mb-6 group-hover:scale-110 transition-transform duration-500">.*?</div>',
    '<div className="w-16 h-16 rounded-2xl bg-semantic-info-bg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500"><HeartPulse className="w-8 h-8 text-semantic-info-text" /></div>',
    content, flags=re.DOTALL
)

content = re.sub(
    r'<h2 className="text-2xl font-bold text-semantic-danger-text mb-2">\{t\("i_am_patient"\)\}</h2>\n\s*<p className="text-semantic-danger-text/60 text-sm text-center">',
    '<h2 className="text-xl font-bold text-slate-800 mb-2">{t("i_am_patient")}</h2>\n              <p className="text-slate-500 text-sm text-center">',
    content
)

content = re.sub(
    r'<div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 group-hover:scale-110 transition-transform duration-500">.*?</div>',
    '<div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500"><Stethoscope className="w-8 h-8 text-brand" /></div>',
    content, flags=re.DOTALL
)

content = re.sub(
    r'<h2 className="text-2xl font-bold text-indigo-100 mb-2">\{t\("i_am_doctor"\)\}</h2>\n\s*<p className="text-indigo-200/60 text-sm text-center">',
    '<h2 className="text-xl font-bold text-slate-800 mb-2">{t("i_am_doctor")}</h2>\n              <p className="text-slate-500 text-sm text-center">',
    content
)

# Fix hover borders on the cards
content = content.replace(
    'border-semantic-danger-text/20/20 bg-white/50 backdrop-blur-xl shadow-2xl overflow-hidden transition-all hover:scale-[1.02] hover:border-semantic-danger-text/20/50 hover:bg-white shadow-xl',
    'border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:scale-[1.02] hover:border-brand/30 hover:shadow-md'
)

content = content.replace(
    'border-indigo-500/20 bg-white/50 backdrop-blur-xl shadow-2xl overflow-hidden transition-all hover:scale-[1.02] hover:border-indigo-500/50 hover:bg-white shadow-xl',
    'border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:scale-[1.02] hover:border-brand/30 hover:shadow-md'
)

# Remove background gradients from role selection
content = re.sub(
    r'<div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />',
    '', content
)
content = re.sub(
    r'<div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />',
    '', content
)

# Fix the theme definition for the login forms
old_theme = r"""  const theme = \{
    bgGradient: isDoc \? 'bg-\[radial-gradient\(ellipse_80%_80%_at_50%_-20%,rgba\(79,70,229,0.15\),rgba\(255,255,255,0\)\)\]' : 'bg-\[radial-gradient\(ellipse_80%_80%_at_50%_-20%,rgba\(244,63,94,0.15\),rgba\(255,255,255,0\)\)\]',
    iconGradient: isDoc \? 'from-indigo-600 to-blue-400' : 'from-rose-500 to-pink-400',
    shadow: isDoc \? 'shadow-indigo-500/20' : 'shadow-rose-500/20',
    textGradient: isDoc \? 'from-indigo-300 to-blue-300' : 'from-rose-300 to-pink-300',
    focusRing: isDoc \? 'focus:border-indigo-500 focus:ring-indigo-500' : 'focus:border-semantic-danger-text/20 focus:ring-rose-500',
    buttonBg: isDoc \? 'from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 shadow-indigo-500/20' : 'from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 shadow-rose-500/20',
    title: isDoc \? t\("doctor_login_title"\) : 'Portal Paciente',
    Icon: isDoc \? Stethoscope : HeartPulse
  \};"""

new_theme = """  const theme = {
    bgGradient: '',
    iconBg: isDoc ? 'bg-brand/10 text-brand' : 'bg-semantic-info-bg text-semantic-info-text',
    shadow: 'shadow-sm',
    focusRing: 'focus:border-brand/50 focus:ring-brand/20',
    buttonClass: 'bg-brand text-white hover:bg-brand/90',
    title: isDoc ? t("doctor_login_title") : 'Portal Paciente',
    Icon: isDoc ? Stethoscope : HeartPulse
  };"""

content = re.sub(old_theme, new_theme, content)

# Fix login form UI
content = re.sub(
    r'<div className={w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr \$\{theme\.iconGradient\} flex items-center justify-center shadow-2xl \$\{theme\.shadow\} mb-6}>\n\s*<theme\.Icon className="w-10 h-10 text-white" />',
    '<div className={w-16 h-16 mx-auto rounded-2xl flex items-center justify-center   mb-6}>\n            <theme.Icon className="w-8 h-8" />',
    content
)

content = re.sub(
    r'<button type="submit".*?className={w-full py-3\.5 px-4 rounded-2xl bg-gradient-to-r \$\{theme\.buttonBg\} text-white font-bold flex items-center justify-center gap-2 shadow-xl transition-all active:scale-\[0\.98\] disabled:opacity-70 mt-4}>',
    '<button type="submit"\n              disabled={loading}\n              className={w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 mt-4 }>',
    content, flags=re.DOTALL
)

with open('frontend/src/Auth.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Auth.jsx UI redesigned")
