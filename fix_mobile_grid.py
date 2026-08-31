import os
import re

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Reduce top padding of main container
content = content.replace('className="relative z-10 px-5 pt-8"', 'className="relative z-10 px-4 pt-3"')
# 2. Reduce Header margins
content = content.replace('className="flex justify-between items-center mb-8"', 'className="flex justify-between items-center mb-2"')
# 3. Hero Section compactness
content = content.replace('className="mt-6 mb-6 max-w-[85%] md:max-w-[60%]"', 'className="mt-2 mb-3 max-w-[90%] md:max-w-[60%]"')
content = content.replace('className="text-3xl leading-tight font-bold text-content-primary mb-3"', 'className="text-2xl md:text-3xl leading-tight font-bold text-content-primary mb-1"')
# Hide the hero paragraph on mobile
content = content.replace('className="text-content-secondary text-sm leading-relaxed mb-5"', 'className="text-content-secondary text-sm leading-relaxed mb-3 hidden sm:block"')
# Compact the privacy card
content = content.replace('className="glass-card rounded-2xl p-4 flex gap-3 items-center w-full max-w-sm"', 'className="glass-card rounded-xl p-2.5 flex gap-2 items-center w-full max-w-sm"')
content = content.replace('className="text-xs font-semibold text-content-primary"', 'className="text-[11px] font-semibold text-content-primary leading-tight"')
content = content.replace('className="text-[10px] text-content-secondary mt-0.5"', 'className="text-[9px] text-content-secondary mt-0.5 leading-tight hidden sm:block"')

# 4. Title section
content = content.replace('className="flex items-center justify-center gap-2 mb-4 mt-8"', 'className="flex items-center justify-center gap-2 mb-2 mt-3"')
content = content.replace('className="text-xl font-bold text-center"', 'className="text-lg md:text-xl font-bold text-center"')

# 5. Grid gap
content = content.replace('className="grid grid-cols-2 gap-3 mb-6"', 'className="grid grid-cols-2 gap-2 md:gap-3 mb-4"')

# 6. Action Cards compactness (make the description hidden on mobile)
content = content.replace('className="text-[11px] text-gray-500 leading-relaxed mb-6 relative z-10"', 'className="text-[11px] text-gray-500 leading-relaxed mb-6 relative z-10 hidden sm:block"')
# make padding p-3 instead of p-4
content = content.replace('className="bg-white rounded-3xl p-4 text-left', 'className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-4 text-left')
# make card headers mb-1 or mb-2
content = content.replace('mb-3 relative z-10', 'mb-1 md:mb-3 relative z-10')
# make icon container smaller on mobile
content = content.replace('w-12 h-12', 'w-8 h-8 md:w-12 md:h-12')
# text sizes in cards
content = content.replace('text-[10px] font-bold px-2 py-1', 'text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 md:px-2 md:py-1')
content = content.replace('<h4 className="font-bold text-gray-900 mb-1 relative z-10">', '<h4 className="font-bold text-gray-900 text-xs md:text-base mb-1 relative z-10">')
# the bottom arrow positioning
content = content.replace('bottom-4 right-4', 'bottom-2 right-2 md:bottom-4 md:right-4')
content = content.replace('w-8 h-8', 'w-6 h-6 md:w-8 md:h-8')

# Ensure we don't accidentally shrink the ArrowRight icon too much by replacing size={16}, 
# so we will leave the icons inside as they are (they will just fit snuggly).

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated spacing for ultra-compact mobile view!")
