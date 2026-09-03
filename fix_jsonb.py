import os
import re

# Fix models.py
file_path = 'backend/models.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('from sqlalchemy.dialects.postgresql import UUID, JSONB', 'from sqlalchemy.dialects.postgresql import UUID\nfrom sqlalchemy import JSON')
content = content.replace('payload = Column(JSONB, nullable=True)', 'payload = Column(JSON, nullable=True)')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Fix migration
migration_path = 'backend/alembic/versions/6a77cab82435_add_healthevent_model.py'
with open(migration_path, 'r', encoding='utf-8') as f:
    migration = f.read()

migration = migration.replace('postgresql.JSONB(astext_type=sa.Text())', 'sa.JSON()')

with open(migration_path, 'w', encoding='utf-8') as f:
    f.write(migration)

print("Swapped JSONB for JSON!")
