# Skill de Alexa «Asistente MIVOR»

Permite a la persona mayor hablar con MIVOR desde un Echo (salón, dormitorio, baño):

- «Alexa, abre asistente MIVOR» → saludo y opciones.
- «Alexa, dile a asistente MIVOR que ya me tomé la pastilla / el Betaloc / todas» → lo anota en *Mi salud*.
- «Alexa, pregunta a asistente MIVOR qué me toca» → lo que falta hoy.
- «Alexa, dile a asistente MIVOR que me he caído» → aviso push a los cuidadores y recordatorio de llamar al 112.
  **Alexa no puede llamar a emergencias**: lo dice siempre en voz alta.

El servidor es la propia API de MIVOR (`/api/alexa`, en `backend/routers/alexa.py`); no hace falta AWS Lambda.
La vinculación usa el mismo código de 6 cifras que el Kiosko MIVOR.

## Crear la skill (una sola vez)

Necesitas una cuenta gratuita de **Amazon Developer** con el **mismo correo que la cuenta de Amazon del Echo**
de pruebas (así la skill aparece sola en ese Echo mientras está en desarrollo).

1. Entra en <https://developer.amazon.com/alexa/console/ask> → **Create Skill**.
   - Nombre: `Asistente MIVOR` · Idioma: **Spanish (ES)**.
   - Tipo: **Other** → **Custom** → hosting **Provision your own** → **Start from Scratch** → **Create**.
2. **Build → Interaction Model → JSON Editor**: borra lo que haya, pega el contenido de
   `interactionModels/custom/es-ES.json`, pulsa **Save** y después **Build skill**.
3. **Build → Endpoint**: elige **HTTPS** y en *Default Region* pon
   `https://med-ai-hub-v2-production.up.railway.app/api/alexa`.
   En el certificado elige **«My development endpoint is a sub-domain of a domain that has a wildcard
   certificate from a certificate authority»**. Pulsa **Save**.
4. Copia el **Skill ID** (arriba, empieza por `amzn1.ask.skill.`).
5. En **Railway → servicio med-ai-hub-v2 → Variables** añade `ALEXA_SKILL_ID` con ese valor y pulsa **Deploy**.
   Sin esta variable el servidor rechaza todas las peticiones de Alexa.
6. **Test** (arriba): cambia *Skill testing is enabled in* a **Development** y escribe
   `abre asistente mivor`. Debe responder explicando cómo vincular la cuenta.

## Vincular un Echo con la cuenta del paciente

1. En la web o app de MIVOR (con el perfil del paciente): **Más → Kiosko MIVOR → Generar código**.
2. Al Echo: «Alexa, abre asistente MIVOR» → «mi código es 1 2 3 4 5 6».
3. El Echo aparece en MIVOR en *Dispositivos vinculados* como **Alexa (Echo)**; desde ahí se puede desvincular.

Todos los Echo de la misma cuenta de Amazon comparten la vinculación.

## Antes de dárselo a otras familias

- **Nombre de invocación**: probar con personas mayores que Alexa entiende «asistente MIVOR»
  (el acento puede convertirlo en «mi bono»). Si falla, cambiar `invocationName` en el JSON y en la consola.
- **Beta** (hasta 500 cuentas por correo, sin publicar): *Distribution → Availability → Beta Test*.
- **Publicación**: exige política de privacidad y términos (URL pública), descripción, iconos y la
  certificación de Amazon. Al tratar datos de salud, la política debe explicar qué se guarda (tomas de
  medicación) y cómo desvincular. Amazon no permite que una skill prometa atender emergencias.
- Idiomas: el modelo es `es-ES`. Para México/EE. UU. añadir `es-MX` / `es-US` en la consola con el
  mismo JSON (el servidor ya responde 911 en esos países).
