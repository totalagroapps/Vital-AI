import os

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Robot image animation
content = content.replace(
    'className="absolute top-0 right-0 w-full md:w-[60%] lg:w-[45%] h-[500px] md:h-[800px] z-0 overflow-hidden pointer-events-none"',
    'className="absolute top-0 right-0 w-full md:w-[60%] lg:w-[45%] h-[500px] md:h-[800px] z-0 overflow-hidden pointer-events-none animate-float-slow"'
)

# Hero section animation (wrap it or add to it)
content = content.replace(
    '<div className="mt-2 mb-3 max-w-full md:max-w-[70%]">',
    '<div className="mt-2 mb-3 max-w-full md:max-w-[70%] animate-fade-in-left opacity-0">'
)

# Title animation
content = content.replace(
    '<div className="flex items-center justify-center gap-2 mb-2 mt-3">',
    '<div className="flex items-center justify-center gap-2 mb-2 mt-3 animate-fade-in-up opacity-0" style={{ animationDelay: "100ms" }}>'
)

# Action Cards
card_classes_old = 'className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-4 text-left border border-gray-100 shadow-sm relative overflow-hidden group"'
card_classes_new_base = 'className="bg-white rounded-2xl md:rounded-3xl p-3 md:p-4 text-left border border-gray-100 shadow-sm relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-card-hover transition-all duration-300 ease-out animate-fade-in-up opacity-0"'

# Since all 4 cards have the same old class, we can find them in order and replace with specific delays
pieces = content.split(card_classes_old)
if len(pieces) == 5:
    content = (
        pieces[0] + 
        card_classes_new_base.replace('animate-fade-in-up opacity-0"', 'animate-fade-in-up opacity-0" style={{ animationDelay: "150ms" }}') + 
        pieces[1] + 
        card_classes_new_base.replace('animate-fade-in-up opacity-0"', 'animate-fade-in-up opacity-0" style={{ animationDelay: "250ms" }}') + 
        pieces[2] + 
        card_classes_new_base.replace('animate-fade-in-up opacity-0"', 'animate-fade-in-up opacity-0" style={{ animationDelay: "350ms" }}') + 
        pieces[3] + 
        card_classes_new_base.replace('animate-fade-in-up opacity-0"', 'animate-fade-in-up opacity-0" style={{ animationDelay: "450ms" }}') + 
        pieces[4]
    )

# Footer banner
content = content.replace(
    'className="ai-card-gradient rounded-3xl p-5 flex items-center gap-4 text-white cursor-pointer relative overflow-hidden shadow-lg mb-4"',
    'className="ai-card-gradient rounded-3xl p-5 flex items-center gap-4 text-white cursor-pointer relative overflow-hidden shadow-lg mb-4 animate-fade-in-up opacity-0" style={{ animationDelay: "550ms" }} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-out'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Added animations to PatientHome!")
