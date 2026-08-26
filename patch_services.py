import os
import glob

for filepath in glob.glob('backend/services/*.py'):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('from app.schemas.medical', 'from schemas_medical')
    content = content.replace('from app.services.', 'from services.')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
print("Updated service imports")
