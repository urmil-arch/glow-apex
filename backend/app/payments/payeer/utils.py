import base64
import hashlib
import json
import urllib.parse
from typing import Any

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad

PAYEER_ALLOWED_IPS = frozenset(["185.71.65.92", "185.71.65.189", "149.202.17.210"])


def generate_payeer_signature(
    merchant_id: str,
    order_id: str,
    amount: str,
    currency: str,
    description: str,
    secret_key: str,
    additional_params: str | None = None,
) -> str:
    """Generate SHA256 Payeer digital signature (uppercase hex)."""
    parts = [merchant_id, order_id, amount, currency, description]
    if additional_params:
        parts.append(additional_params)
    parts.append(secret_key)
    raw = ":".join(parts)
    return hashlib.sha256(raw.encode()).hexdigest().upper()


def encrypt_additional_params(
    params: dict[str, Any],
    order_id: str,
    encryption_key: str,
) -> str:
    """Encrypt additional parameters using AES-256-CBC.

    Key derivation: SHA256(MD5(encryptionKey + orderId))[:32]
    IV: MD5(encryptionKey + orderId)[:16]
    """
    md5_val = hashlib.md5(f"{encryption_key}{order_id}".encode()).hexdigest()
    key = hashlib.sha256(md5_val.encode()).digest()[:32]
    iv = md5_val[:16].encode()

    cipher = AES.new(key, AES.MODE_CBC, iv)
    encrypted = cipher.encrypt(pad(json.dumps(params).encode(), AES.block_size))
    return urllib.parse.quote(base64.b64encode(encrypted).decode())


def verify_payeer_webhook_signature(
    operation_id: str,
    operation_ps: str,
    operation_date: str,
    operation_pay_date: str,
    shop_id: str,
    order_id: str,
    amount: str,
    currency: str,
    description: str,
    status: str,
    received_signature: str,
    secret_key: str,
    additional_params: str | None = None,
) -> bool:
    """Verify a Payeer webhook signature using SHA256."""
    parts = [
        operation_id, operation_ps, operation_date, operation_pay_date,
        shop_id, order_id, amount, currency, description, status,
    ]
    if additional_params:
        parts.append(additional_params)
    parts.append(secret_key)
    raw = ":".join(parts)
    expected = hashlib.sha256(raw.encode()).hexdigest().upper()
    return expected == received_signature


def is_valid_payeer_ip(ip: str) -> bool:
    """Check whether an IP belongs to Payeer's known webhook server addresses."""
    return ip in PAYEER_ALLOWED_IPS


def format_payeer_amount(amount: float) -> str:
    """Format amount as a two-decimal-place string for Payeer."""
    return f"{amount:.2f}"
