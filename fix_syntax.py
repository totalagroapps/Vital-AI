import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix syntax error in upload_document
content = content.replace(
    '''async def upload_document(
    current_user_id: str = Depends(get_current_user_id),
    patient_id: str,''',
    '''async def upload_document(
    patient_id: str,
    current_user_id: str = Depends(get_current_user_id),'''
)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
