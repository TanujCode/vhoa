import smtplib
import threading
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from app.config import settings

# Resolve logo path once at module load
_BASE_DIR = os.path.dirname(__file__)


def _ensure_baked_email_logo() -> str:
    """
    Creates an email-optimized logo with an opaque solid white badge baked into the image pixels.
    This prevents Gmail mobile dark mode from making transparent dark letters invisible.
    """
    public_dir = os.path.abspath(os.path.join(_BASE_DIR, "..", "..", "..", "frontend", "hoa-portal", "public"))
    dest_path = os.path.join(public_dir, "logo_email.png")
    src_light = os.path.join(public_dir, "logo_light.png")

    if os.path.exists(src_light):
        try:
            from PIL import Image, ImageDraw
            img = Image.open(src_light).convert("RGBA")
            w, h = img.size
            pad_x, pad_y = 50, 24
            bg_w, bg_h = w + (pad_x * 2), h + (pad_y * 2)
            
            # Create RGB image with 100% solid white pixels
            bg = Image.new("RGBA", (bg_w, bg_h), (255, 255, 255, 255))
            draw = ImageDraw.Draw(bg)
            draw.rounded_rectangle([3, 3, bg_w - 4, bg_h - 4], radius=28, fill=(255, 255, 255, 255), outline=(226, 232, 240, 255), width=3)
            bg.paste(img, (pad_x, pad_y), img)
            
            # Save as solid RGB PNG (zero alpha channel, completely bulletproof against email client dark-mode inversion)
            final_rgb = Image.new("RGB", (bg_w, bg_h), (255, 255, 255))
            final_rgb.paste(bg, (0, 0), bg)
            final_rgb.save(dest_path, "PNG", quality=95)
            print(f"[email_service] Generated solid baked email logo: {dest_path}")
            return dest_path
        except Exception as e:
            print(f"[email_service] PIL bake fallback: {e}")
            return src_light
    return src_light


_LOGO_PATH = _ensure_baked_email_logo()


def _send_email_thread(to_email: str, subject: str, html_body: str, from_name: str = None):
    username = settings.MAIL_USERNAME.strip('"').strip("'").strip()
    password = settings.MAIL_PASSWORD.strip('"').strip("'").replace(" ", "").strip()
    mail_from = settings.MAIL_FROM.strip('"').strip("'").strip()
    if not from_name:
        from_name = settings.MAIL_FROM_NAME.strip('"').strip("'")

    # Build multipart/related so inline CID image works in Gmail
    msg = MIMEMultipart("related")
    msg["Subject"] = subject
    msg["From"]    = f"{from_name} <{mail_from}>"
    msg["To"]      = to_email

    # Wrap HTML in alternative part (text/html)
    msg_alt = MIMEMultipart("alternative")
    msg.attach(msg_alt)
    msg_alt.attach(MIMEText(html_body, "html"))

    # Attach logo as inline CID image (no attachment shown in Gmail)
    logo_path = _ensure_baked_email_logo()
    if logo_path and os.path.exists(logo_path):
        try:
            with open(logo_path, "rb") as f:
                img_data = f.read()
            img = MIMEImage(img_data, "png")
            img.add_header("Content-ID", "<vhoa_logo>")
            img.add_header("Content-Disposition", "inline")
            msg.attach(img)
        except Exception as e:
            print(f"[email_service] Failed to attach logo: {e}")

    def _send(server):
        server.sendmail(mail_from, to_email, msg.as_string())

    try:
        print(f"Attempting SMTP_SSL on port 465 to {to_email}...")
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
            server.login(username, password)
            _send(server)
        print(f"Email sent successfully to {to_email} via port 465")
        return
    except Exception as e:
        print(f"SMTP_SSL port 465 failed: {e}")

    try:
        print(f"Attempting SMTP+STARTTLS on port 587 to {to_email}...")
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as server:
            server.starttls()
            server.login(username, password)
            _send(server)
        print(f"Email sent successfully to {to_email} via port 587 (fallback)")
        return
    except Exception as e:
        print(f"SMTP port 587 fallback failed: {e}")


def send_email(to_email: str, subject: str, html_body: str, from_name: str = None) -> bool:
    """Run SMTP transport asynchronously in a background thread so it doesn't block the request lifecycle"""
    thread = threading.Thread(target=_send_email_thread, args=(to_email, subject, html_body, from_name))
    thread.start()
    return True


def _wrap_in_responsive_layout(inner_html: str, subtitle: str = "Rental Property Management") -> str:
    """Wraps inner HTML in a responsive, centered table layout with high-contrast logo badge for dark mode compatibility."""
    return f"""
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6; width: 100%; height: 100%; margin: 0; padding: 36px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <tr>
        <td align="center" valign="top">
          <div style="width: 100%; max-width: 520px; margin: 0 auto; text-align: left; padding: 0 12px;">
            
            <!-- Centered Official NestBloq Logo -->
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="https://nestbloq.vercel.app/logo_light.png" alt="NestBloq" width="180" style="height: auto; width: 180px; max-width: 100%; display: inline-block; vertical-align: middle; border: 0; outline: none; text-decoration: none;" />
            </div>

            <!-- Main Card Container -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td bgcolor="#ffffff" style="background-color: #ffffff !important; padding: 36px 32px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; color: #374151;">
                  {inner_html}
                </td>
              </tr>
            </table>

            <!-- Footer / Subtitle -->
            <div style="text-align: center; margin-top: 24px;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px; font-weight: 500;">
                © 2026 NestBloq — {subtitle or 'Rental Property Management'}
              </p>
            </div>

          </div>
        </td>
      </tr>
    </table>
    """


def send_otp_email(to_email: str, otp_code: str, otp_type: str, system_name: str = "Rental Property Management") -> bool:
    """Send OTP email"""
    type_labels = {
        "email_verify":   "Verify your Email",
        "mobile_verify":  "Verify your Mobile",
        "password_reset": "Reset your Password",
        "login_2fa":      "Verify your Login",
    }
    label = type_labels.get(otp_type, "Verify your Account")
    
    from_name = "NestBloq Rental Management"
    subject = f"Rental Portal — {label} OTP"

    inner_html = f"""
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: bold; color: #111827; text-align: left;">{label}</h2>
      <p style="color: #4b5563; margin: 0 0 24px; font-size: 15px; line-height: 1.6; text-align: left;">
        Hi there,<br /><br />
        Your verification code for NestBloq is below. This code is valid for <strong>10 minutes</strong>.
      </p>

      <!-- OTP Box -->
      <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111827; font-family: monospace;">
          {otp_code}
        </span>
      </div>

      <div style="margin: 24px 0; text-align: center;">
        <a href="{settings.FRONTEND_URL.rstrip('/')}/rental/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Log In to Rental Portal
        </a>
      </div>

      <!-- Security Tip -->
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px; border: 1px solid #f3f4f6; margin-top: 32px; text-align: left;">
        <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
          <strong>Security tip:</strong> NestBloq will never ask for this verification code by phone, text message, or chat. If you didn't request this, please ignore this email.
        </p>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html, subtitle=system_name)
    return send_email(to_email, subject, html, from_name=from_name)


def send_welcome_email(to_email: str, full_name: str) -> bool:
    """Registration welcome email"""
    subject = "Welcome to NestBloq Rental Portal — Property Management"
    inner_html = f"""
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: bold; color: #111827;">Welcome, {full_name}! 👋</h2>
      <p style="color: #4b5563; line-height: 1.6; font-size: 15px; margin: 0 0 16px;">
        Your account has been created successfully on NestBloq Rental Management Platform.
      </p>
      <p style="color: #4b5563; line-height: 1.6; font-size: 15px; margin: 0 0 24px;">
        Please verify your email address to get full access to your account.
      </p>
      <div style="margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px; border-left: 4px solid #2563eb; border-top: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; text-align: left;">
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">
          <strong>Next step:</strong> Go to your profile and verify your email address using OTP.
        </p>
      </div>
      <div style="margin: 24px 0; text-align: center;">
        <a href="{settings.FRONTEND_URL.rstrip('/')}/rental/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Log In to Rental Portal
        </a>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html, subtitle="Rental Property Management")
    return send_email(to_email, subject, html)
