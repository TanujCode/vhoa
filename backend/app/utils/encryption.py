"""
AES-256-GCM Encryption Utility for NestBloq Rental Portal.

Encrypts/decrypts sensitive PII and financial fields stored in the database.
Algorithm: AES-256-GCM (authenticated encryption — detects tampering).

Storage format (base64-encoded):
    nonce (12 bytes) | ciphertext (N bytes) | auth_tag (16 bytes)

Key: 32-byte hex string from AES_ENCRYPTION_KEY env variable.
"""

import base64
import os
import secrets
from typing import Optional

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _get_key() -> bytes:
    """Load and validate the AES-256 key from config."""
    from app.config import settings
    hex_key = settings.AES_ENCRYPTION_KEY
    if not hex_key:
        raise RuntimeError(
            "AES_ENCRYPTION_KEY is not set in .env. "
            "Generate one with: python -c \"import secrets; print(secrets.token_hex(32))\""
        )
    key_bytes = bytes.fromhex(hex_key)
    if len(key_bytes) != 32:
        raise RuntimeError(
            f"AES_ENCRYPTION_KEY must be exactly 32 bytes (64 hex chars). Got {len(key_bytes)} bytes."
        )
    return key_bytes


# ─── String field encryption ─────────────────────────────────────────────────

def encrypt_field(plaintext: Optional[str]) -> Optional[str]:
    """
    Encrypt a string field with AES-256-GCM.
    Returns a base64-encoded string safe for Text/String DB columns.
    Returns None if input is None.
    """
    if plaintext is None:
        return None
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = secrets.token_bytes(12)          # 96-bit random nonce
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    # ciphertext already includes the 16-byte auth tag appended by GCM
    combined = nonce + ciphertext            # 12 + len(plaintext) + 16 bytes
    return base64.b64encode(combined).decode("ascii")


def decrypt_field(encrypted: Optional[str]) -> Optional[str]:
    """
    Decrypt a base64-encoded AES-256-GCM encrypted string.
    Returns None if input is None or empty.
    Raises ValueError if decryption fails (tampered/wrong key).
    """
    if not encrypted:
        return None
    try:
        key = _get_key()
        combined = base64.b64decode(encrypted.encode("ascii"))
        nonce = combined[:12]
        ciphertext = combined[12:]           # includes GCM auth tag at the end
        aesgcm = AESGCM(key)
        plaintext_bytes = aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext_bytes.decode("utf-8")
    except Exception as e:
        raise ValueError(f"Decryption failed: {e}")


# ─── Float field encryption ──────────────────────────────────────────────────

def encrypt_float(value: Optional[float]) -> Optional[str]:
    """
    Encrypt a float/decimal value.
    Converts to string then encrypts. Stored as Text in DB.
    """
    if value is None:
        return None
    return encrypt_field(str(value))


def decrypt_float(encrypted: Optional[str]) -> Optional[float]:
    """
    Decrypt an encrypted float field.
    Returns None if input is None/empty.
    """
    if not encrypted:
        return None
    raw = decrypt_field(encrypted)
    if raw is None:
        return None
    try:
        return float(raw)
    except ValueError:
        raise ValueError(f"Decrypted value is not a valid float: {raw!r}")


# ─── File bytes encryption ──────────────────────────────────────────────────

def encrypt_file_bytes(data: bytes) -> bytes:
    """
    Encrypt raw file bytes with AES-256-GCM.
    Returns encrypted bytes (nonce + ciphertext+tag) — NOT base64 encoded.
    Use this for saving encrypted files to disk.
    """
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = secrets.token_bytes(12)
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return nonce + ciphertext


def decrypt_file_bytes(data: bytes) -> bytes:
    """
    Decrypt AES-256-GCM encrypted file bytes.
    Input must be the raw bytes produced by encrypt_file_bytes().
    """
    key = _get_key()
    nonce = data[:12]
    ciphertext = data[12:]
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, None)


# ─── Safe helpers (for migration / mixed DB states) ─────────────────────────

def safe_decrypt_field(value: Optional[str]) -> Optional[str]:
    """
    Attempt decryption; if it fails (e.g., legacy plaintext value), return as-is.
    Use ONLY during a migration window — not in production steady state.
    """
    if not value:
        return value
    try:
        return decrypt_field(value)
    except Exception:
        return value  # return plaintext as-is (legacy row)


def safe_decrypt_float(value: Optional[str], fallback: float = 0.0) -> float:
    """
    Attempt to decrypt a float field.
    Falls back to parsing as plain float if decryption fails (legacy rows).
    """
    if not value:
        return fallback
    try:
        return decrypt_float(value)
    except Exception:
        try:
            return float(value)
        except Exception:
            return fallback
