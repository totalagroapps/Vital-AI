import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Current language handling code in backend/main.py:
#       lang_instruction = ""
#       if request.language == "en":
#           lang_instruction = "\n\nIMPORTANT: You must communicate with the patient exclusively in English."

new_lang_handling = '''
    lang_map = {
        "es": "Spanish (Español)",
        "en": "English",
        "fr": "French (Français)",
        "ar": "Arabic (العربية)"
    }
    target_lang = lang_map.get(request.language, request.language) if request.language else "Spanish (Español)"
    lang_instruction = f"\\n\\nCRITICAL INSTRUCTION: You MUST communicate with the patient EXCLUSIVELY in {target_lang}. Translate all your medical triage responses to {target_lang}. Do NOT use Spanish unless {target_lang} is Spanish."
'''

content = re.sub(
    r'lang_instruction = ""\s*if request\.language == "en":\s*lang_instruction = "\\n\\nIMPORTANT: You must communicate with the patient exclusively in English\."',
    new_lang_handling.strip(),
    content
)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
