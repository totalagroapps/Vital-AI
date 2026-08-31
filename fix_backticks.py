import os

file_path = 'frontend/src/views/DoctorOnboarding.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I need to fix the classNames that lost their backticks
# className={w-8 ... } -> className={`w-8 ...`}
content = content.replace("className={w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm\n                  ${", "className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors shadow-sm\n                  ${")
content = content.replace("'bg-white border-2 border-gray-200 text-gray-400'}\n                }>", "'bg-white border-2 border-gray-200 text-gray-400'}\n                `}>")

content = content.replace("className={text-[10px] font-bold text-center leading-tight\n                  ${", "className={`text-[10px] font-bold text-center leading-tight\n                  ${")
content = content.replace("'text-gray-400'}\n                }>", "'text-gray-400'}\n                `}>")

content = content.replace("className={flex-1 h-0.5 -mt-6 transition-colors\n                  ${", "className={`flex-1 h-0.5 -mt-6 transition-colors\n                  ${")
content = content.replace("'bg-gray-200'}\n                } />", "'bg-gray-200'}\n                `} />")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
