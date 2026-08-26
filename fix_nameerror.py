import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the StandardChatRequest definition
old_code = '''class StandardChatRequest(BaseModel):
    messages: List[ChatMessage]
    language: Optional[str] = "es"'''

new_code = '''class StandardChatMessage(BaseModel):
    role: str
    content: str

class StandardChatRequest(BaseModel):
    messages: List[StandardChatMessage]
    language: Optional[str] = "es"'''

content = content.replace(old_code, new_code)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed NameError")
