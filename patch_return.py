import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block_return = '''                "id": t.id,
                "category": t.category,
                "status": t.status,
                "final_report": t.final_report,
                "created_at": t.created_at.isoformat() if t.created_at else None'''

new_block_return = '''                "id": t.id,
                "category": t.category,
                "status": t.status,
                "final_report": t.final_report,
                "recommended_specialty": t.recommended_specialty,
                "created_at": t.created_at.isoformat() if t.created_at else None'''

content = content.replace(old_block_return, new_block_return)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated return schema for triages")
