import asyncio
import html as html_lib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.common.config import settings


def _build_owner_notification_html(
    name: str,
    email: str,
    subject: str,
    message: str,
    contact_type: str,
) -> str:
    type_label = "Customer Support" if contact_type == "support" else "Business Inquiry"
    safe_name = html_lib.escape(name)
    safe_email = html_lib.escape(email)
    safe_subject = html_lib.escape(subject)
    safe_message = html_lib.escape(message)
    return f"""
    <html>
      <body style="font-family: sans-serif; background: #f9fafb; padding: 32px;">
        <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 12px;
                    padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <h2 style="margin-top: 0; color: #111827;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; width: 90px; font-size: 14px;
                         vertical-align: top;">Type</td>
              <td style="padding: 8px 0; color: #111827; font-weight: 600;
                         font-size: 14px;">{type_label}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;
                         vertical-align: top;">Name</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px;">{safe_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;
                         vertical-align: top;">Email</td>
              <td style="padding: 8px 0; font-size: 14px;">
                <a href="mailto:{safe_email}" style="color: #059669;">{safe_email}</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 14px;
                         vertical-align: top;">Subject</td>
              <td style="padding: 8px 0; color: #111827; font-size: 14px;">{safe_subject}</td>
            </tr>
          </table>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
            <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px;
                      text-transform: uppercase; letter-spacing: 0.05em;">Message</p>
            <p style="margin: 0; color: #111827; font-size: 14px;
                      white-space: pre-wrap;">{safe_message}</p>
          </div>
          <p style="margin-top: 24px; color: #9ca3af; font-size: 12px;">
            Hit Reply to respond directly to {safe_name}.
          </p>
        </div>
      </body>
    </html>
    """


def _build_user_confirmation_html(name: str, subject: str) -> str:
    safe_name = html_lib.escape(name)
    safe_subject = html_lib.escape(subject)
    return f"""
    <html>
      <body style="font-family: sans-serif; background: #f9fafb; padding: 32px;">
        <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px;
                    padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <h2 style="margin-top: 0; color: #111827;">Hi {safe_name},</h2>
          <p style="color: #374151;">
            Thanks for reaching out to <strong>Glow-Apex</strong>. We've received your
            message and will get back to you within <strong>24 hours</strong>.
          </p>
          <div style="background: #f0fdf4; border-left: 3px solid #059669; border-radius: 4px;
                      padding: 12px 16px; margin: 20px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">Your message subject</p>
            <p style="margin: 4px 0 0; color: #111827; font-weight: 600;">{safe_subject}</p>
          </div>
          <p style="color: #374151;">
            In the meantime, feel free to browse our services or check out our FAQ for
            quick answers.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">
            If you did not submit this message, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
    """


async def _smtp_send(msg: MIMEMultipart) -> None:
    """Send a single MIME message via SMTP."""
    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USER,
        password=settings.SMTP_PASSWORD,
        start_tls=True,
        timeout=30,
    )


async def send_contact_emails(
    name: str,
    email: str,
    subject: str,
    message: str,
    contact_type: str,
) -> None:
    """Send the owner notification and user confirmation emails in parallel via SMTP."""
    owner_to = settings.CONTACT_OWNER_EMAIL or settings.SMTP_FROM

    owner_msg = MIMEMultipart("alternative")
    owner_msg["Subject"] = (
        f"[Glow-Apex] {'Customer Support' if contact_type == 'support' else 'Business Inquiry'} "
        f"from {html_lib.escape(name)}: {html_lib.escape(subject)}"
    )
    owner_msg["From"] = settings.SMTP_FROM
    owner_msg["To"] = owner_to
    owner_msg["Reply-To"] = email
    owner_msg.attach(MIMEText(_build_owner_notification_html(name, email, subject, message, contact_type), "html"))

    user_msg = MIMEMultipart("alternative")
    user_msg["Subject"] = "We received your message — Glow-Apex"
    user_msg["From"] = settings.SMTP_FROM
    user_msg["To"] = email
    user_msg.attach(MIMEText(_build_user_confirmation_html(name, subject), "html"))

    await asyncio.gather(
        _smtp_send(owner_msg),
        _smtp_send(user_msg),
    )
