from cryptography.fernet import Fernet
import base64
import hashlib

from app.core.config import settings


def _get_fernet() -> Fernet:
    key = settings.TOTP_ENCRYPTION_KEY
    if not key:
        raise RuntimeError("TOTP_ENCRYPTION_KEY is not configured")
    if len(key) < 32:
        raise RuntimeError("TOTP_ENCRYPTION_KEY must be at least 32 characters")
    hashed = hashlib.sha256(key.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(hashed)
    return Fernet(fernet_key)


def encrypt_secret(plain_text: str) -> str:
    f = _get_fernet()
    return f.encrypt(plain_text.encode()).decode()


def decrypt_secret(encrypted: str) -> str:
    f = _get_fernet()
    return f.decrypt(encrypted.encode()).decode()
