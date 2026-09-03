import os
import re

file_path = 'frontend/src/views/PatientHome.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the white text issue
content = content.replace('<h3 className="text-lg md:text-xl font-bold text-center">QuǸ te gustara hacer hoy?</h3>', '<h3 className="text-lg md:text-xl font-bold text-center text-gray-900">QuǸ te gustara hacer hoy?</h3>')
# Wait, encoding might be an issue with special characters. Let's use regex for safety.
content = re.sub(r'<h3 className="text-lg md:text-xl font-bold text-center">', r'<h3 className="text-lg md:text-xl font-bold text-center text-gray-900">', content)

# Fix the squeezed text by removing <br /> tags
old_hero = '''<h2 className="text-2xl md:text-3xl leading-tight font-bold text-content-primary mb-1">
              Tu salud, <br />
              mǭs fǭcil de <br />
              <span className="text-brand-purple">entender</span> y <br />
              <span className="text-brand-purple">gestionar.</span>
            </h2>'''

# Replace the br tags with spaces. Because of encoding, I'll use regex.
content = re.sub(r'Tu salud, <br \/>\s*m\D*s f\D*cil de <br \/>\s*<span className="text-brand-purple">entender<\/span> y <br \/>\s*<span className="text-brand-purple">gestionar\.<\/span>',
                 r'Tu salud, mǭs fǭcil de <span className="text-brand-purple">entender</span> y <span className="text-brand-purple">gestionar.</span>', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated text color and removed hardcoded line breaks!")
