import os

with open('backend/models.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_cols = '''    emergency_contact = Column(String, nullable=True)'''
new_cols = '''    emergency_contact = Column(String, nullable=True)
    height = Column(String, nullable=True)
    weight = Column(String, nullable=True)'''

if 'height = Column' not in content:
    content = content.replace(old_cols, new_cols)
    with open('backend/models.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched models.py")
else:
    print("Already patched")
