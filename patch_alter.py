import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''            await conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR DEFAULT 'es';"))'''

new_block = '''            await conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS preferred_language VARCHAR DEFAULT 'es';"))
            await conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS height VARCHAR;"))
            await conn.execute(text("ALTER TABLE patient_profiles ADD COLUMN IF NOT EXISTS weight VARCHAR;"))'''

content = content.replace(old_block, new_block)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Injected ALTER TABLE commands")
