import os

with open('backend/models.py', 'r', encoding='utf-8') as f:
    content = f.read()

if 'recommended_specialty' not in content:
    content = content.replace("final_report = Column(String, nullable=True)", "final_report = Column(String, nullable=True)\n    recommended_specialty = Column(String, nullable=True)")
    
    with open('backend/models.py', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched models.py successfully")
else:
    print("Already patched")
