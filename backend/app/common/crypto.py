import base64
import os

from Crypto.Cipher import AES

from app.common.config import settings

# AES-256-GCM: 16-byte nonce, 16-byte authentication tag, variable-length ciphertext.
# Stored format: base64(nonce || tag || ciphertext)
_NONCE_SIZE = 16
_TAG_SIZE = 16


def _get_key() -> bytes:
    """Derive the 32-byte AES key from the env secret. Raises if not configured."""
    secret = settings.API_KEY_ENCRYPTION_SECRET.strip()
    if not secret:
        raise RuntimeError(
            "API_KEY_ENCRYPTION_SECRET is not set. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    try:
        key = bytes.fromhex(secret)
    except ValueError as exc:
        raise RuntimeError("API_KEY_ENCRYPTION_SECRET must be a 64-character hex string") from exc
    if len(key) != 32:
        raise RuntimeError("API_KEY_ENCRYPTION_SECRET must decode to exactly 32 bytes")
    return key


def encrypt_value(plaintext: str) -> str:
    """Encrypt a string with AES-256-GCM and return a base64-encoded ciphertext blob."""
    key = _get_key()
    nonce = os.urandom(_NONCE_SIZE)
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    ciphertext, tag = cipher.encrypt_and_digest(plaintext.encode())
    blob = nonce + tag + ciphertext
    return base64.b64encode(blob).decode()


def decrypt_value(stored: str) -> str:
    """Decrypt a base64-encoded AES-256-GCM blob and return the original plaintext.

    Returns the stored string unchanged if it cannot be decrypted — allows
    unencrypted legacy values to pass through during a migration.
    """
    key = _get_key()
    try:
        blob = base64.b64decode(stored)
        if len(blob) < _NONCE_SIZE + _TAG_SIZE:
            return stored
        nonce = blob[:_NONCE_SIZE]
        tag = blob[_NONCE_SIZE:_NONCE_SIZE + _TAG_SIZE]
        ciphertext = blob[_NONCE_SIZE + _TAG_SIZE:]
        cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
        return cipher.decrypt_and_verify(ciphertext, tag).decode()
    except Exception:
        # Blob is not a valid ciphertext — return as-is (plaintext legacy value)
        return stored
