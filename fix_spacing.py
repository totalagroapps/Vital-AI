import os

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('className="relative z-10 px-6 pt-12"', 'className="relative z-10 px-5 pt-8"')
content = content.replace('className="mt-8 mb-10 max-w-[70%]"', 'className="mt-6 mb-6 max-w-[85%] md:max-w-[60%]"')
content = content.replace('className="text-[32px] leading-tight font-bold text-content-primary mb-4"', 'className="text-3xl leading-tight font-bold text-content-primary mb-3"')
content = content.replace('className="text-content-secondary text-sm leading-relaxed mb-6"', 'className="text-content-secondary text-sm leading-relaxed mb-5"')
content = content.replace('className="flex items-center justify-center gap-2 mb-6 mt-16"', 'className="flex items-center justify-center gap-2 mb-4 mt-8"')
content = content.replace('className="grid grid-cols-2 gap-4 mb-6"', 'className="grid grid-cols-2 gap-3 mb-6"')
# make padding in the cards slightly smaller too
content = content.replace('className="bg-white rounded-3xl p-5', 'className="bg-white rounded-3xl p-4')
content = content.replace('mb-4 relative z-10"', 'mb-3 relative z-10"')
content = content.replace('mb-2 relative z-10"', 'mb-1 relative z-10"')
content = content.replace('mb-8 relative z-10"', 'mb-6 relative z-10"')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated margins and paddings for mobile view!")
