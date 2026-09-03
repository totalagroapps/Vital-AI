import os
import re

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix Background Image so text is readable
# We want the image to be anchored to the right, not take up the full width, and have a strong fade on the left.
content = content.replace(
    'className="absolute top-0 right-0 w-full md:w-[60%] lg:w-[50%] h-[500px] md:h-[800px] z-0 overflow-hidden pointer-events-none animate-float-slow"',
    'className="absolute top-0 right-0 w-[85%] md:w-[60%] lg:w-[50%] h-[400px] md:h-[800px] z-0 overflow-hidden pointer-events-none animate-float-slow"'
)
content = content.replace(
    "style={{ maskImage: 'linear-gradient(to right, transparent, black 15%)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%)' }}",
    "style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 40%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)' }}"
)

# 2. Compress Layout to fit on one screen
# Header spacing
content = content.replace('className="relative z-10 px-5 pt-4"', 'className="relative z-10 px-4 pt-2"')
content = content.replace('className="flex justify-between items-start mb-6"', 'className="flex justify-between items-start mb-3"')
# Logo size
content = content.replace('width="28" height="28"', 'width="24" height="24"')
content = content.replace('text-2xl', 'text-xl')
content = content.replace('ml-9 -mt-1', 'ml-8 -mt-1 text-[9px]')
content = content.replace('w-10 h-10', 'w-8 h-8') # Profile & Bell
content = content.replace('size={18}', 'size={16}') # Bell icon

# Hero Section
content = content.replace('className="mt-4 mb-6 max-w-full md:max-w-[70%]"', 'className="mt-1 mb-4 max-w-[80%] md:max-w-[70%]"')
content = content.replace('className="text-3xl leading-tight font-bold text-content-primary mb-3"', 'className="text-[22px] leading-tight font-bold text-content-primary mb-1.5"')
content = content.replace('className="text-content-secondary text-sm leading-relaxed max-w-[85%] md:max-w-full font-medium"', 'className="text-content-secondary text-[11px] leading-snug max-w-[90%] font-medium"')

# Action Grid
content = content.replace('grid-cols-2 gap-3 mb-6', 'grid-cols-2 gap-2 mb-3')

# Cards Inner
content = content.replace('className="bg-white rounded-2xl md:rounded-3xl p-4 text-left text-content-primary border border-gray-100 shadow-sm relative overflow-hidden group flex flex-col h-full"', 'className="bg-white rounded-2xl md:rounded-3xl p-2.5 md:p-4 text-left text-content-primary border border-gray-100 shadow-sm relative overflow-hidden group flex flex-col h-full"')

content = content.replace('className="mb-3"', 'className="mb-1.5"')
content = content.replace('className="w-10 h-10 rounded-full', 'className="w-7 h-7 md:w-10 md:h-10 rounded-full')
content = content.replace('size={20}', 'size={14}') # Card icons

content = content.replace('className="font-bold text-[13px] md:text-base leading-snug mb-2 pr-2"', 'className="font-bold text-[11px] md:text-base leading-tight mb-1 pr-2"')
content = content.replace('className="text-[10px] md:text-[11px] leading-relaxed mb-6 flex-1 pr-1"', 'className="text-[9px] md:text-[11px] leading-tight mb-4 flex-1 pr-1"')
content = content.replace('bottom-3 right-3 w-7 h-7', 'bottom-2 right-2 w-5 h-5 md:w-7 md:h-7')
content = content.replace('size={14}', 'size={12}') # Arrow right

# AI Banner
content = content.replace('className="bg-white/80 backdrop-blur-xl border border-brand-purple/10 rounded-3xl p-4 md:p-5 shadow-sm mb-4', 'className="bg-white/90 backdrop-blur-xl border border-brand-purple/10 rounded-2xl p-2.5 md:p-5 shadow-sm mb-2')
content = content.replace('className="flex items-start gap-3 mb-4"', 'className="flex items-start gap-2 mb-2"')
content = content.replace('size={20}', 'size={16}') # Sparkles
content = content.replace('className="font-bold text-brand-dark text-[15px] mb-1"', 'className="font-bold text-brand-dark text-[12px] mb-0.5"')
content = content.replace('className="text-[11px] text-gray-500 leading-relaxed pr-2"', 'className="text-[9px] text-gray-500 leading-tight pr-2"')

# Search input
content = content.replace('rounded-2xl py-3 pl-9 pr-12 text-[12px]', 'rounded-xl py-2 pl-8 pr-10 text-[10px]')
content = content.replace('size={16}', 'size={12}') # Search icon
content = content.replace('w-8 h-8', 'w-6 h-6') # Mic button
# content = content.replace('size={14}', 'size={10}') # Mic icon - already done globally above or I'll just regex it

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Aggressively optimized layout for single-screen mobile view!")
