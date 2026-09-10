"""
encryption.py — Cifrado AES-256-GCM para campos PHI/ePHI (HIPAA + GDPR)

Estándar aplicado:
  - Algoritmo  : AES-256-GCM (authenticated encryption)
  - Clave      : 256 bits (32 bytes) derivada de PHI_ENCRYPTION_KEY (base64 en .env)
  - Nonce/IV   : 12 bytes aleatorios por operación (GCM estándar)
  - Tag        : 16 bytes de autenticación (detecta manipulación)
  - Formato BD : base64url( nonce[12] || ciphertext || tag[16] ) como Text
"""

import base64
import os
import logging
from typing import Any
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy import Text
from sqlalchemy.engine import Dialect
from sqlalchemy.types import TypeDecorator

logger = logging.getLogger(__name__)

# Clave fija de desarrollo si no existe PHI_ENCRYPTION_KEY configurada
_DEV_FALLBACK_KEY = b"VitalAI_HIPAA_Safe_Key_32bytes!"

def _load_encryption_key() -> bytes:
    """
    Carga la clave AES-256 desde la variable de entorno PHI_ENCRYPTION_KEY.
    La clave debe estar codificada en base64 y representar exactamente 32 bytes.
    """
    raw = os.environ.get("PHI_ENCRYPTION_KEY", "")
    if not raw:
        env = os.environ.get("RAILWAY_ENVIRONMENT", "").lower()
        if env in ["production", "prod"]:
            raise RuntimeError(
                "[HIPAA/GDPR] La variable de entorno PHI_ENCRYPTION_KEY es obligatoria en producción. "
                "Genera una clave con: python -c \"import os, base64; print(base64.b64encode(os.urandom(32)).decode())\""
            )
        logger.warning("[HIPAA/GDPR] PHI_ENCRYPTION_KEY no configurada. Usando clave de desarrollo local.")
        return _DEV_FALLBACK_KEY

    try:
        key_bytes = base64.b64decode(raw)
    except Exception as exc:
        raise RuntimeError("[HIPAA/GDPR] PHI_ENCRYPTION_KEY no es un valor base64 válido.") from exc

    if len(key_bytes) != 32:
        raise RuntimeError(
            f"[HIPAA/GDPR] PHI_ENCRYPTION_KEY debe representar exactamente 32 bytes (AES-256), pero tiene {len(key_bytes)} bytes."
        )
    return key_bytes


def _get_aesgcm() -> AESGCM:
    return AESGCM(_load_encryption_key())


NONCE_SIZE = 12   # bytes — estándar GCM
TAG_SIZE   = 16   # bytes — autenticación GCM


def encrypt_value(plaintext: str) -> str:
    """
    Cifra un string con AES-256-GCM.
    Retorna: str — base64url(nonce[12] || ciphertext || tag[16])
    """
    if plaintext is None:
        return None
    if not isinstance(plaintext, str):
        plaintext = str(plaintext)
    aesgcm = _get_aesgcm()
    nonce = os.urandom(NONCE_SIZE)
    ciphertext_with_tag = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    payload = nonce + ciphertext_with_tag
    return base64.urlsafe_b64encode(payload).decode("ascii")


def decrypt_value(encrypted_b64: str) -> str:
    """
    Descifra un valor cifrado con encrypt_value().
    """
    if encrypted_b64 is None:
        return None
    try:
        payload = base64.urlsafe_b64decode(encrypted_b64.encode("ascii"))
        if len(payload) < (NONCE_SIZE + TAG_SIZE):
            return encrypted_b64 # Retornar como texto si no está cifrado (legacy/fallback)
        nonce = payload[:NONCE_SIZE]
        ciphertext_with_tag = payload[NONCE_SIZE:]
        aesgcm = _get_aesgcm()
        decrypted_bytes = aesgcm.decrypt(nonce, ciphertext_with_tag, None)
        return decrypted_bytes.decode("utf-8")
    except Exception as e:
        # Si no pudo descifrar (ej. datos legacy en texto plano), devolver texto original
        logger.debug(f"Valor no cifrado o error al descifrar: {e}")
        return encrypted_b64


class EncryptedString(TypeDecorator):
    """
    Tipo SQLAlchemy que cifra al escribir en BD y descifra al leer.
    En BD se almacena como Text.
    """
    impl = Text
    cache_ok = True

    def __init__(self, max_length: int = 255, **kwargs):
        super().__init__(**kwargs)
        self.max_length = max_length

    def process_bind_param(self, value: Any, dialect: Dialect) -> str | None:
        if value is None:
            return None
        return encrypt_value(str(value))

    def process_result_value(self, value: Any, dialect: Dialect) -> str | None:
        if value is None:
            return None
        return decrypt_value(str(value))


class EncryptedText(TypeDecorator):
    """
    Tipo SQLAlchemy para textos largos cifrados (descripciones, notas, etc.).
    """
    impl = Text
    cache_ok = True

    def process_bind_param(self, value: Any, dialect: Dialect) -> str | None:
        if value is None:
            return None
        return encrypt_value(str(value))

    def process_result_value(self, value: Any, dialect: Dialect) -> str | None:
        if value is None:
            return None
        return decrypt_value(str(value))
