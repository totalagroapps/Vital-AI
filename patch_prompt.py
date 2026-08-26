import re

with open('backend/main.py', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'prompt = f\"\"\"Eres un asistente.*?model="llama3\.1",.*?messages=\[\{"role": "user", "content": prompt\}\]\s*\)', re.DOTALL)

new_code = '''prompt = f\"\"\"Eres un asistente médico experto. A continuación tienes el texto extraído de un documento clínico de un paciente.
Tu tarea es analizar el documento y devolver el resultado ESTRICTAMENTE en formato JSON, usando esta estructura exacta:
{{
  "resumen": "Explicación del resultado en lenguaje sencillo y amigable para el paciente",
  "diagnosticos": ["diag 1", "diag 2"],
  "anomalias": ["anomalía 1", "anomalía 2"],
  "medicamentos": ["med 1", "med 2"],
  "severidad": "verde", // verde (normal), amarillo (atención) o rojo (urgencia)
  "preguntas_sugeridas": ["pregunta 1", "pregunta 2"]
}}

OMITE estrictamente cualquier dato personal identificable (Nombres completos, DNI, dirección).
Si el texto es ininteligible o no es médico, devuelve un JSON con severidad "amarillo" indicando el error en el "resumen".

Texto:
{raw_text[:4000]}
\"\"\"
              resp = await client.chat(
                  model="llama3.1",
                  messages=[{"role": "user", "content": prompt}],
                  format="json"
              )'''

content = pattern.sub(new_code, content)

with open('backend/main.py', 'w', encoding='utf-8') as f:
    f.write(content)
