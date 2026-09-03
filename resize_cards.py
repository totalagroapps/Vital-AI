import os

file_path = 'frontend/src/views/PatientHomeDesktop.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Increase spacing between cards and footer now that button is gone
content = content.replace('mb-8">\\n              \\n              <div onClick={() => onNavigate', 'mb-12">\\n              \\n              <div onClick={() => onNavigate')

# Make the cards slightly taller/bigger
# Increase padding: lg:p-5 -> lg:p-6
content = content.replace('lg:p-5 border border-gray-100', 'lg:p-6 border border-gray-100')
# Increase titles: lg:text-xs -> lg:text-sm
content = content.replace('lg:text-xs text-brand-purple', 'lg:text-sm text-brand-purple')
content = content.replace('lg:text-xs text-brand-green', 'lg:text-sm text-brand-green')
content = content.replace('lg:text-xs text-blue-500', 'lg:text-sm text-blue-500')
content = content.replace('lg:text-xs text-brand-orange', 'lg:text-sm text-brand-orange')
content = content.replace('lg:text-xs text-purple-600', 'lg:text-sm text-purple-600')

# Increase descriptions: lg:text-[11px] -> lg:text-xs
content = content.replace('lg:text-[11px] text-gray-500', 'lg:text-xs text-gray-500')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Resized elements in PatientHomeDesktop.jsx")
