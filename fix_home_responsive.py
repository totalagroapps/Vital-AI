import os

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = "import PatientHomeDesktop from './PatientHomeDesktop';\n"
if "import PatientHomeDesktop" not in content:
    content = content.replace("import React", import_stmt + "import React")

# Wrap content
target_open = '''  return (
    <div className="flex-1 w-full relative min-h-screen pb-24 font-sans bg-base overflow-x-hidden">'''
repl_open = '''  return (
    <>
    <div className="block lg:hidden flex-1 w-full relative min-h-screen pb-24 font-sans bg-base overflow-x-hidden">'''
# Note: the user's PC screenshot looks very wide. Standard md: might trigger too early (tablet). I'll use lg:.

target_close = '''    </div>
  );
};'''
repl_close = '''    </div>
    
    <div className="hidden lg:block">
      <PatientHomeDesktop onNavigate={onNavigate} />
    </div>
    </>
  );
};'''

content = content.replace(target_open, repl_open)
content = content.replace(target_close, repl_close)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated PatientHome.jsx to include Desktop view")
