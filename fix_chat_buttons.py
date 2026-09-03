import os

file_path = 'frontend/src/views/PatientChat.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the image and pdf buttons conditionally
content = content.replace(
    '''<button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 text-gray-400 hover:text-brand-purple transition-colors rounded-full hover:bg-brand-purple/10">
              <ImageIcon size={22} />
            </button>
            
            <button type="button" onClick={() => pdfInputRef.current?.click()} className="p-2 text-gray-400 hover:text-brand-purple transition-colors rounded-full hover:bg-brand-purple/10">
              <Paperclip size={22} />
            </button>''',
    '''{imageInputRef && (
              <button type="button" onClick={() => imageInputRef.current?.click()} className="p-2 text-gray-400 hover:text-brand-purple transition-colors rounded-full hover:bg-brand-purple/10">
                <ImageIcon size={22} />
              </button>
            )}
            
            {pdfInputRef && (
              <button type="button" onClick={() => pdfInputRef.current?.click()} className="p-2 text-gray-400 hover:text-brand-purple transition-colors rounded-full hover:bg-brand-purple/10">
                <Paperclip size={22} />
              </button>
            )}'''
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed PatientChat.jsx attachment buttons")
