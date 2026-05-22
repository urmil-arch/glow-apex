import base64
import hashlib
import json
from typing import Any


def generate_cryptomus_signature(data: dict[str, Any], api_key: str) -> str:
    """Generate Cryptomus API signature: MD5(base64(json) + api_key)."""
    json_str = json.dumps(data, separators=(",", ":"))
    b64 = base64.b64encode(json_str.encode()).decode()
    return hashlib.md5(f"{b64}{api_key}".encode()).hexdigest()


def verify_cryptomus_webhook_signature(
    payload: dict[str, Any],
    received_sign: str,
    api_key: str,
) -> bool:
    """Verify a Cryptomus webhook payload signature."""
    expected = generate_cryptomus_signature(payload, api_key)
    return expected == received_sign


def format_cryptomus_amount(amount: float) -> str:
    """Format an amount as a string with up to 8 decimal places, trailing zeros stripped."""
    formatted = f"{amount:.8f}".rstrip("0").rstrip(".")
    return formatted if formatted else "0"


def map_cryptomus_status(status: str) -> str:
    """Map a Cryptomus payment_status string to internal standardized status."""
    mapping: dict[str, str] = {
        "check": "PENDING",
        "paid": "PAID",
        "paid_over": "PAID",
        "wrong_amount": "FAILED",
        "cancel": "FAILED",
        "fail": "FAILED",
        "system_fail": "FAILED",
        "refund_fail": "FAILED",
        "refund_process": "REFUND",
        "refund_paid": "REFUNDED",
    }
    return mapping.get(status, "PENDING")
