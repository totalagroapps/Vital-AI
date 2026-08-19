# MedIA Hub V2 - API Backend (Arquitectura Híbrida)

Este backend de FastAPI está configurado para un **Despliegue Híbrido**, diseñado para ejecutarse en la nube (Railway) y conectarse a un modelo de Inteligencia Artificial de Visión de forma local (Edge AI).

## Arquitectura

- **Backend (API):** FastAPI, diseñado para desplegarse en **Railway**.
- **Base de Datos:** PostgreSQL en la nube (**Neon**). Conectado asíncronamente mediante SQLAlchemy + asyncpg.
- **Inteligencia Artificial (Edge AI):** Ollama corriendo **localmente** en la PC de desarrollo (para evitar costos de GPU en la nube), expuesto a la nube mediante un **Cloudflare Tunnel**.

## Configuración de Variables de Entorno

En producción (Railway) o en tu entorno local, debes configurar el archivo `.env`:

```env
# URL de conexión a Neon PostgreSQL
DATABASE_URL=postgresql+asyncpg://usuario:contraseña@servidor.neon.tech/medai_v2

# URL de Ollama (Cloudflare Tunnel en Producción, o localhost en Desarrollo)
OLLAMA_HOST=https://tu-tunel-temporal.trycloudflare.com
```

### Actualización Constante de `OLLAMA_HOST`
Dado que el motor OCR (`minicpm-v`) corre en la computadora de Cristian usando un túnel temporal gratuito de Cloudflare, la URL cambiará cada vez que se reinicie el túnel.
**IMPORTANTE:** Quien administre Railway debe entrar al Dashboard y actualizar la variable `OLLAMA_HOST` con el nuevo enlace generado por Cloudflare cada vez que se levante el servicio local, para que el endpoint `/api/documents/upload` siga funcionando.

## Desarrollo Local

Si vas a desarrollar en tu propia computadora:
1. Asegúrate de tener Python 3.12.
2. Crea el entorno virtual: `python -m venv venv`
3. Instala las dependencias: `pip install -r requirements.txt`
4. Ejecuta: `run_server.bat` (Windows) o `uvicorn main:app --reload --port 8000`.
