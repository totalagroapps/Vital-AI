import os
import re

file_path = 'frontend/src/views/TriageWizard.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the rogue small microphone button
content = re.sub(
    r'<button\s*onClick=\{toggleListening\}\s*className=\{bsolute bottom-2 right-2 p-2 rounded-full transition-colors \$\{isListening \? \'bg-red-500 text-white animate-pulse\' : \'bg-gray-100 text-gray-500 hover:bg-gray-200\'\}\}\s*>\s*<Mic size=\{18\} />\s*</button>',
    '',
    content,
    flags=re.MULTILINE
)

# 2. Fix the BIG microphone button
bad_big_mic_section = '''<button className="w-16 h-16 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center shadow-inner mx-4">
                  <Mic size={28} />
                </button>
                <div className="flex items-center gap-1">
                  {[2, 1, 3, 2, 4, 2, 1, 3, 1, 2, 1].map((h, i) => (
                    <div key={i} className="w-1 bg-current rounded-full" style={{ height: h * 4 + 'px' }} />
                  ))}
                </div>
              </div>
              <p className="font-bold text-gray-900 text-sm">Pulsa el micrófono para hablar</p>
              <p className="text-xs text-gray-400 mt-1">Te escucho...</p>'''

good_big_mic_section = '''<button 
                  onClick={toggleListening}
                  className={w-16 h-16 rounded-full flex items-center justify-center shadow-inner mx-4 transition-all duration-300 }
                >
                  <Mic size={28} />
                </button>
                <div className="flex items-center gap-1">
                  {[2, 1, 3, 2, 4, 2, 1, 3, 1, 2, 1].map((h, i) => (
                    <div key={i} className={w-1 bg-current rounded-full transition-all duration-300 } style={{ height: (isListening ? h * 6 : h * 4) + 'px' }} />
                  ))}
                </div>
              </div>
              <p className="font-bold text-gray-900 text-sm">
                {isListening ? 'Escuchando atentamente...' : 'Pulsa el micrófono para hablar'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isListening ? 'Habla ahora, estoy procesando tu voz' : 'Te escucho...'}
              </p>'''

# Apply the fix (allowing for potential encoding issues in the Spanish text in the source code)
# The source code had "Pulsa el micrfono para hablar". I'll use regex for the whole block to be safe.
regex_bad_block = r'<button className="w-16 h-16 rounded-full bg-brand-purple/10 text-brand-purple flex items-center justify-center shadow-inner mx-4">.*?<p className="text-xs text-gray-400 mt-1">Te escucho\.\.\.</p>'
content = re.sub(regex_bad_block, good_big_mic_section, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Big Mic button successfully wired up!")
