import os
file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Force colors with inline styles
content = content.replace(
    'className="font-bold text-content-primary text-[13px] md:text-base leading-snug mb-2 pr-2"',
    'className="font-bold text-[13px] md:text-base leading-snug mb-2 pr-2" style={{ color: "#1E293B" }}'
)
content = content.replace(
    'className="text-[10px] md:text-[11px] text-content-secondary leading-relaxed mb-6 flex-1 pr-1"',
    'className="text-[10px] md:text-[11px] leading-relaxed mb-6 flex-1 pr-1" style={{ color: "#64748B" }}'
)

# Remove the fade-in animation from the cards just in case opacity is getting stuck on Windows
content = content.replace(' animate-fade-in-up opacity-0', '')
content = content.replace(' style={{ animationDelay: "150ms" }}', '')
content = content.replace(' style={{ animationDelay: "250ms" }}', '')
content = content.replace(' style={{ animationDelay: "350ms" }}', '')
content = content.replace(' style={{ animationDelay: "450ms" }}', '')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Applied inline styles and removed animations!")
