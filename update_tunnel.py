import os

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

old_url = "https://myers-groundwater-enters-digital.trycloudflare.com"
new_url = "https://right-turbo-bacteria-separated.trycloudflare.com"

content = content.replace(old_url, new_url)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated tunnel URL")
