import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """
    Send email via Gmail SMTP.
    Returns True if successful, False if failed.
    """
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
        msg["To"]      = to_email

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())

        print(f"✅ Email sent to {to_email}")
        return True

    except Exception as e:
        print(f"❌ Email failed: {e}")
        return False


# ══════════════════════════════════════════════
#  EMAIL TEMPLATES
# ══════════════════════════════════════════════

def send_otp_email(to_email: str, otp_code: str, otp_type: str) -> bool:
    """Send OTP email"""

    type_labels = {
        "email_verify":   "Email Verification",
        "mobile_verify":  "Mobile Verification",
        "password_reset": "Password Reset",
    }
    label = type_labels.get(otp_type, "Verification")

    subject = f"VHOAS — {label} OTP"

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D1B2A; color: #ffffff; border-radius: 16px; overflow: hidden;">

      <!-- Header -->
      <div style="background: #162535; padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff;">
          <span style="color: #14B8A6;">V</span>HOAS
        </h1>
        <p style="margin: 8px 0 0; color: #9CA3AF; font-size: 14px;">HOA Management System</p>
      </div>

      <!-- Body -->
      <div style="padding: 40px 30px; text-align: center;">
        <h2 style="margin: 0 0 10px; font-size: 20px;">{label}</h2>
        <p style="color: #9CA3AF; margin: 0 0 30px; font-size: 15px;">
          Your one-time verification code is:
        </p>

       <!-- OTP Box - Mobile Friendly -->
<div style="background: #162535; border: 2px solid #14B8A6; border-radius: 12px; padding: 18px 25px; display: inline-block; margin: 20px 0 30px; max-width: 100%;">
  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #14B8A6; font-family: monospace;">
    {otp_code}
  </span>
</div>

        <p style="color: #9CA3AF; font-size: 13px; margin: 0;">
          ⏰ This code expires in <strong style="color: #ffffff;">10 minutes</strong>
        </p>
        <p style="color: #6B7280; font-size: 12px; margin: 16px 0 0;">
          If you did not request this, please ignore this email.
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #162535; padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="margin: 0; color: #6B7280; font-size: 12px;">
          © 2026 VHOAS — HOA Management System
        </p>
      </div>
    </div>
    """
    return send_email(to_email, subject, html)


def send_welcome_email(to_email: str, full_name: str) -> bool:
    """Registration ke baad welcome email"""
    subject = "Welcome to VHOAS — HOA Management"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D1B2A; color: #ffffff; border-radius: 16px; overflow: hidden;">
      <div style="background: #162535; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;"><span style="color: #14B8A6;">V</span>HOAS</h1>
      </div>
      <div style="padding: 40px 30px;">
        <h2 style="margin: 0 0 16px;">Welcome, {full_name}! 👋</h2>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Your account has been created successfully on VHOAS HOA Management System.
        </p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Please verify your email address to get full access to your account.
        </p>
        <div style="margin: 30px 0; padding: 20px; background: #162535; border-radius: 12px; border-left: 4px solid #14B8A6;">
          <p style="margin: 0; color: #9CA3AF; font-size: 14px;">
            Next step: Go to your profile and verify your email address using OTP.
          </p>
        </div>
      </div>
      <div style="background: #162535; padding: 20px; text-align: center;">
        <p style="margin: 0; color: #6B7280; font-size: 12px;">© 2026 VHOAS</p>
      </div>
    </div>
    """
    return send_email(to_email, subject, html)


def send_violation_email(
    to_email: str,
    resident_name: str,
    violation_type: str,
    amount: float,
    due_date: str,
    remarks: str,
) -> bool:
    """Send email to resident when a violation is issued"""
    subject = f"VHOAS — Violation Notice: {violation_type}"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D1B2A; color: #ffffff; border-radius: 16px; overflow: hidden;">
      <div style="background: #162535; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;"><span style="color: #14B8A6;">V</span>HOAS</h1>
      </div>
      <div style="padding: 40px 30px;">
        <div style="background: #7F1D1D; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
          <p style="margin: 0; font-size: 18px;">⚠️ Violation Notice</p>
        </div>
        <p>Dear <strong>{resident_name}</strong>,</p>
        <p style="color: #9CA3AF;">A violation has been issued for your property.</p>

        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="color: #9CA3AF; padding: 8px 0;">Violation Type</td><td style="text-align: right; font-weight: bold;">{violation_type}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Fine Amount</td><td style="text-align: right; font-weight: bold; color: #F87171;">${amount}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Due Date</td><td style="text-align: right;">{due_date}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Remarks</td><td style="text-align: right;">{remarks or 'N/A'}</td></tr>
          </table>
        </div>

        <p style="color: #9CA3AF; font-size: 13px;">
          You have 30 days to dispute this violation through the VHOAS portal.
        </p>
      </div>
      <div style="background: #162535; padding: 20px; text-align: center;">
        <p style="margin: 0; color: #6B7280; font-size: 12px;">© 2026 VHOAS</p>
      </div>
    </div>
    """
    return send_email(to_email, subject, html)