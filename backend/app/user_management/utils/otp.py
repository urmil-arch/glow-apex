import hashlib
import random
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.common.config import settings


def generate_otp() -> str:
    """Generate a cryptographically random 6-digit OTP."""
    return f"{random.SystemRandom().randint(0, 999999):06d}"


def hash_otp(otp: str) -> str:
    """SHA-256 hash the OTP before storage."""
    return hashlib.sha256(otp.encode()).hexdigest()


def verify_otp_hash(plain_otp: str, hashed_otp: str) -> bool:
    """Return True if the plain OTP matches the stored hash."""
    return hash_otp(plain_otp) == hashed_otp


def _build_otp_email(to_email: str, full_name: str, otp: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Verify your BuyRealViews account"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email

    html = f"""
    <html>
      <body style="font-family: sans-serif; background: #f9fafb; padding: 32px;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <h2 style="margin-top: 0; color: #111827;">Hi {full_name},</h2>
          <p style="color: #374151;">Your verification code for <strong>BuyRealViews</strong> is:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #059669;">{otp}</span>
          </div>
          <p style="color: #6b7280;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">If you did not create an account, you can safely ignore this email.</p>
        </div>
      </body>
    </html>
    """
    msg.attach(MIMEText(html, "html"))
    return msg


async def send_otp_email(to_email: str, full_name: str, otp: str) -> None:
    """Send OTP verification email via Gmail SMTP (TLS on port 587)."""
    msg = _build_otp_email(to_email, full_name, otp)
    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
    )
