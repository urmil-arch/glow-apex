import asyncio
import html as html_lib

import resend

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


async def send_contact_emails(
    name: str,
    email: str,
    subject: str,
    message: str,
    contact_type: str,
) -> None:
    """Send the owner notification and user confirmation emails in parallel via Resend."""
    resend.api_key = settings.RESEND_API_KEY
    owner_to = settings.CONTACT_OWNER_EMAIL or settings.RESEND_FROM

    owner_params: resend.Emails.SendParams = {
        "from": settings.RESEND_FROM,
        "to": [owner_to],
        "reply_to": email,
        "subject": f"[Glow-Apex] {'Customer Support' if contact_type == 'support' else 'Business Inquiry'} from {html_lib.escape(name)}: {html_lib.escape(subject)}",
        "html": _build_owner_notification_html(name, email, subject, message, contact_type),
    }
    user_params: resend.Emails.SendParams = {
        "from": settings.RESEND_FROM,
        "to": [email],
        "subject": "We received your message — Glow-Apex",
        "html": _build_user_confirmation_html(name, subject),
    }
    await asyncio.gather(
        asyncio.to_thread(resend.Emails.send, owner_params),
        asyncio.to_thread(resend.Emails.send, user_params),
    )


# --- SMTP alternative (aiosmtplib) — see git history or otp.py comments for the original
#     _build_owner_notification / _build_user_confirmation / _send implementations.
#     To switch back: restore aiosmtplib import, restore MIMEMultipart builders,
#     replace asyncio.gather calls with the original _send() pattern,
#     and restore aiosmtplib in requirements.txt.
