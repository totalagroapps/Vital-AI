import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    '''            "notes": doc.notes,
            "download_url": presigned_url
        })''',
    '''            "notes": doc.notes,
            "extracted_text": doc.extracted_text,
            "download_url": presigned_url
        })'''
)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
