"""
Versión del APK realmente publicado en la release "latest" de GitHub.

El workflow build-apk.yml sube mivor-latest.json (versión + SHA-256) DESPUÉS del APK.
/api/version anuncia esa versión: así Railway no puede anunciar una versión cuyo APK
todavía no está subido (antes la app descargaba el APK anterior y seguía pidiendo actualizar).
"""
import logging
import time
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

MANIFEST_URL = "https://github.com/totalagroapps/Vital-AI/releases/download/latest/mivor-latest.json"
_CACHE_SECONDS = 120
_cache: dict = {"at": 0.0, "data": None}


async def get_published_apk() -> Optional[dict]:
    """{'version': '1.0.6', 'sha256': '…'} o None si no se puede leer (se usa la versión configurada)."""
    now = time.monotonic()
    if _cache["at"] and now - _cache["at"] < _CACHE_SECONDS:
        return _cache["data"]
    data = None
    try:
        async with httpx.AsyncClient(timeout=5, follow_redirects=True) as client:
            response = await client.get(MANIFEST_URL)
        if response.status_code == 200:
            body = response.json()
            version = str(body.get("version") or "").strip()
            sha256 = str(body.get("sha256") or "").strip().lower()
            if version:
                data = {"version": version, "sha256": sha256 if len(sha256) == 64 else None}
    except Exception as exc:
        logger.warning(f"No se pudo leer el manifiesto del APK publicado: {exc}")
    _cache.update(at=now, data=data)
    return data
