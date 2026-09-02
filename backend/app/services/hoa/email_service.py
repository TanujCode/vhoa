import smtplib
import threading
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from app.config import settings

# Resolve logo path once at module load
_BASE_DIR = os.path.dirname(__file__)
_LOGO_PATH = None
for _candidate in [
    os.path.abspath(os.path.join(_BASE_DIR, "..", "..", "..", "frontend", "hoa-portal", "public", "logo_light.png")),
    os.path.abspath(os.path.join(_BASE_DIR, "..", "..", "frontend", "hoa-portal", "public", "logo_light.png")),
    os.path.abspath(os.path.join(_BASE_DIR, "..", "..", "..", "..", "frontend", "hoa-portal", "public", "logo_light.png")),
    os.path.abspath(os.path.join(_BASE_DIR, "..", "..", "..", "frontend", "hoa-portal", "public", "logo_dark.png")),
]:
    if os.path.exists(_candidate):
        _LOGO_PATH = _candidate
        break
print(f"[email_service] Logo path: {_LOGO_PATH}")


def _send_email_thread(to_email: str, subject: str, html_body: str, from_name: str = None):
    username = settings.MAIL_USERNAME.strip('"').strip("'")
    password = settings.MAIL_PASSWORD.strip('"').strip("'")
    mail_from = settings.MAIL_FROM.strip('"').strip("'")
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
    if _LOGO_PATH:
        try:
            with open(_LOGO_PATH, "rb") as f:
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
    # Run SMTP transport asynchronously in a background thread so it doesn't block the request lifecycle
    thread = threading.Thread(target=_send_email_thread, args=(to_email, subject, html_body, from_name))
    thread.start()
    return True


def _wrap_in_responsive_layout(inner_html: str, subtitle: str = "Property Management System") -> str:
    """Wraps inner HTML in a responsive, centered table layout that matches Dockly UI (light theme)."""
    return f"""
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f3f4f6; width: 100%; height: 100%; margin: 0; padding: 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <tr>
        <td align="center" valign="top">
          <div style="width: 100%; max-width: 520px; margin: 0 auto; text-align: left; padding: 0 10px;">
            
            <!-- Centered Logo above the white card -->
            <div style="text-align: center; margin-bottom: 24px;">
              <img src="cid:vhoa_logo" alt="NestBloq Logo" style="height: 38px; width: auto; display: inline-block; vertical-align: middle;" />
            </div>

            <!-- Main Card Container -->
            <div style="background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #eef0f3; color: #374151;">
              {inner_html}
            </div>

            <!-- Footer / Subtitle -->
            <div style="text-align: center; margin-top: 24px;">
              <p style="margin: 0; color: #9CA3AF; font-size: 12px;">
                © 2026 NestBloq — {subtitle or 'Property Management System'}
              </p>
            </div>

          </div>
        </td>
      </tr>
    </table>
    """


# ══════════════════════════════════════════════
#  EMAIL TEMPLATES
# ══════════════════════════════════════════════

def send_otp_email(to_email: str, otp_code: str, otp_type: str, system_name: str = "Property Management System") -> bool:
    """Send OTP email"""
    type_labels = {
        "email_verify":   "Verify your Email",
        "mobile_verify":  "Verify your Mobile",
        "password_reset": "Reset your Password",
        "login_2fa":      "Verify your Login (2FA)",
    }
    label = type_labels.get(otp_type, "Verify your Account")
    
    from_name = "NestBloq Property Management"
    if "rental" in system_name.lower():
        subject = f"Rental Portal — {label} OTP"
    elif "condo" in system_name.lower():
        subject = f"Condo Portal — {label} OTP"
    else:
        subject = f"NestBloq Portal — {label} OTP"

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
        <a href="{settings.FRONTEND_URL.rstrip('/')}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Log In to Portal
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
    subject = "Welcome to NestBloq Portal — Property Management"
    inner_html = f"""
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: bold; color: #111827;">Welcome, {full_name}! </h2>
      <p style="color: #4b5563; line-height: 1.6; font-size: 15px; margin: 0 0 16px;">
        Your account has been created successfully on NestBloq Property Management System.
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
        <a href="{settings.FRONTEND_URL.rstrip('/')}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Log In to Portal
        </a>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html, subtitle="")
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
    subject = f"NestBloq Portal — Violation Notice: {violation_type}"
    inner_html = f"""
      <div style="background: #fee2e2; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #991b1b; font-weight: bold; font-size: 18px; border: 1px solid #fecaca;">
        ⚠️ Violation Notice
      </div>
      <p style="font-size: 15px; color: #111827; margin: 0 0 12px;">Dear <strong>{resident_name}</strong>,</p>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">A violation has been issued for your property.</p>

      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
          <tr><td style="color: #6b7280; padding: 8px 0;">Violation Type</td><td style="text-align: right; font-weight: bold; color: #111827;">{violation_type}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Fine Amount</td><td style="text-align: right; font-weight: bold; color: #dc2626;">${amount}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Due Date</td><td style="text-align: right; color: #111827;">{due_date}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Remarks</td><td style="text-align: right; color: #111827;">{remarks or 'N/A'}</td></tr>
        </table>
      </div>

      <p style="color: #6b7280; font-size: 13px; line-height: 1.5; margin: 0 0 24px;">
        You have 30 days to dispute this violation through the NestBloq portal.
      </p>

      <div style="margin: 24px 0; text-align: center;">
        <a href="{settings.FRONTEND_URL.rstrip('/')}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Log In to Portal
        </a>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html, subtitle="")
    return send_email(to_email, subject, html)


def send_booking_created_email(
    booking_id: int,
    amenity_name: str,
    community_name: str,
    booked_by_name: str,
    booking_date: str,
    slot_time: str,
    fee_amount: float,
    payment_due_date: str,
    status_type: str,
    to_email: str
) -> bool:
    """Send amenity booking confirmation or payment due email to user/board"""
    subject = f"NestBloq Portal — Amenity Booking Request: {amenity_name}"
    
    if status_type == "CONFIRMED":
        status_label = "Confirmed"
        status_color = "#065f46"  # Dark green
        status_bg = "#d1fae5"     # Light green
        status_border = "#a7f3d0"
        status_banner = " Booking Confirmed"
        detail_msg = "Your booking is confirmed! No further action is required."
    else:
        status_label = "Payment Due"
        status_color = "#92400e"  # Dark orange
        status_bg = "#fef3c7"     # Light yellow
        status_border = "#fde68a"
        status_banner = "⚠️ Payment Due"
        detail_msg = f"Your booking is pending payment. Please make a payment of <strong>${fee_amount}</strong> by <strong>{payment_due_date}</strong> to confirm your slot."

    inner_html = f"""
      <div style="background: {status_bg}; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: {status_color}; font-weight: bold; font-size: 18px; border: 1px solid {status_border};">
        {status_banner}
      </div>
      <p style="font-size: 15px; color: #111827; margin: 0 0 12px;">Hello,</p>
      <p style="color: #4b5563; line-height: 1.6; font-size: 15px; margin: 0 0 20px;">
        An amenity booking request has been submitted for <strong>{community_name}</strong>.
      </p>

      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
          <tr><td style="color: #6b7280; padding: 8px 0;">Amenity</td><td style="text-align: right; font-weight: bold; color: #111827;">{amenity_name}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Booked By</td><td style="text-align: right; font-weight: bold; color: #111827;">{booked_by_name}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Date</td><td style="text-align: right; color: #111827;">{booking_date}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Time Slot</td><td style="text-align: right; color: #111827;">{slot_time}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Fee Amount</td><td style="text-align: right; font-weight: bold; color: #059669;">${fee_amount}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Status</td><td style="text-align: right; font-weight: bold; color: {status_color};">{status_label}</td></tr>
        </table>
      </div>

      <p style="color: #4b5563; line-height: 1.6; font-size: 14px; margin: 0 0 24px;">
        {detail_msg}
      </p>

      <div style="margin: 24px 0; text-align: center;">
        <a href="{settings.FRONTEND_URL.rstrip('/')}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Log In to Portal
        </a>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html)
    return send_email(to_email, subject, html)


def send_payment_received_email(
    booking_id: int,
    amenity_name: str,
    community_name: str,
    booked_by_name: str,
    booking_date: str,
    slot_time: str,
    fee_amount: float,
    to_email: str
) -> bool:
    """Send payment receipt confirmation email to user/board"""
    subject = f"NestBloq Portal — Payment Confirmed for {amenity_name}"
    inner_html = f"""
      <div style="background: #d1fae5; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #065f46; font-weight: bold; font-size: 18px; border: 1px solid #a7f3d0;">
         Payment Received & Confirmed
      </div>
      <p style="font-size: 15px; color: #111827; margin: 0 0 12px;">Hello,</p>
      <p style="color: #4b5563; line-height: 1.6; font-size: 15px; margin: 0 0 20px;">
        Your payment of <strong>${fee_amount}</strong> for booking the amenity <strong>{amenity_name}</strong> in <strong>{community_name}</strong> has been successfully received and confirmed.
      </p>

      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
          <tr><td style="color: #6b7280; padding: 8px 0;">Amenity</td><td style="text-align: right; font-weight: bold; color: #111827;">{amenity_name}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Booked By</td><td style="text-align: right; font-weight: bold; color: #111827;">{booked_by_name}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Date</td><td style="text-align: right; color: #111827;">{booking_date}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Time Slot</td><td style="text-align: right; color: #111827;">{slot_time}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Amount Paid</td><td style="text-align: right; font-weight: bold; color: #059669;">${fee_amount}</td></tr>
        </table>
      </div>

      <p style="color: #4b5563; line-height: 1.6; font-size: 14px; margin: 0 0 24px;">
        Enjoy your reservation! Let us know if you have any questions.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="{settings.FRONTEND_URL.rstrip('/')}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Log In to Portal
        </a>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html)
    return send_email(to_email, subject, html)


def send_general_payment_receipt_email(
    to_email: str,
    payer_name: str,
    amount: float,
    reason: str,
    payment_method: str,
    transaction_id: str,
    community_name: str,
    escrow_bank: str = None
) -> bool:
    """Send general payment receipt"""
    subject = f"NestBloq Portal — Payment Receipt: {reason.replace('_', ' ').title()}"
    escrow_info = f"<p style='color: #4b5563; font-size: 14px; margin: 16px 0 0;'>Paid to Escrow Bank: <strong>{escrow_bank}</strong></p>" if escrow_bank else ""
    inner_html = f"""
      <div style="background: #d1fae5; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #065f46; font-weight: bold; font-size: 18px; border: 1px solid #a7f3d0;">
         Payment Successful
      </div>
      <p style="font-size: 15px; color: #111827; margin: 0 0 12px;">Hello {payer_name},</p>
      <p style="color: #4b5563; line-height: 1.6; font-size: 15px; margin: 0 0 20px;">
        Your payment has been successfully processed for <strong>{community_name}</strong>.
      </p>

      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
          <tr><td style="color: #6b7280; padding: 8px 0;">Payment Reason</td><td style="text-align: right; font-weight: bold; color: #111827;">{reason.replace('_', ' ').title()}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Amount Paid</td><td style="text-align: right; font-weight: bold; color: #059669;">${amount}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Payment Method</td><td style="text-align: right; color: #111827;">{payment_method.replace('_', ' ').title()}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Transaction Ref</td><td style="text-align: right; color: #111827;">{transaction_id}</td></tr>
        </table>
      </div>
      {escrow_info}
      <div style="margin: 24px 0; text-align: center;">
        <a href="{settings.FRONTEND_URL.rstrip('/')}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Log In to Portal
        </a>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html)
    return send_email(to_email, subject, html)


def send_due_payment_reminder_email(
    to_email: str,
    payer_name: str,
    amount: float,
    reason: str,
    due_date: str,
    community_name: str,
    days_left: int
) -> bool:
    """Send due payment reminder email"""
    subject = f"NestBloq Portal — Reminder: Payment Due in {days_left} Days"
    inner_html = f"""
      <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #92400e; font-weight: bold; font-size: 18px; border: 1px solid #fde68a;">
        ⏰ Payment Reminder: {days_left} Days Left
      </div>
      <p style="font-size: 15px; color: #111827; margin: 0 0 12px;">Dear {payer_name},</p>
      <p style="color: #4b5563; line-height: 1.6; font-size: 15px; margin: 0 0 20px;">
        This is a friendly reminder that you have an upcoming payment due for <strong>{community_name}</strong>.
      </p>

      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
          <tr><td style="color: #6b7280; padding: 8px 0;">Description</td><td style="text-align: right; font-weight: bold; color: #111827;">{reason.replace('_', ' ').title()}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Amount Due</td><td style="text-align: right; font-weight: bold; color: #dc2626;">${amount}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Due Date</td><td style="text-align: right; color: #111827;">{due_date}</td></tr>
        </table>
      </div>
      <p style="color: #4b5563; line-height: 1.6; font-size: 14px; margin: 0 0 24px;">
        Please log in to the NestBloq portal to complete this payment.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="{settings.FRONTEND_URL.rstrip('/')}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Log In to Portal
        </a>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html)
    return send_email(to_email, subject, html)


def send_invite_email(to_email: str, full_name: str, temp_password: str, community_name: str, role_name: str) -> bool:
    """Send email invitation to join community"""
    subject = f"Invitation to join {community_name} on NestBloq Portal"
    role_label = role_name.replace('_', ' ').title()
    inner_html = f"""
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: bold; color: #111827;">Hello, {full_name}! </h2>
      <p style="color: #4b5563; line-height: 1.6; font-size: 15px; margin: 0 0 16px;">
        You have been invited to join the community <strong>{community_name}</strong> as a <strong>{role_label}</strong> on the NestBloq Portal.
      </p>
      <p style="color: #4b5563; line-height: 1.6; font-size: 15px; margin: 0 0 20px;">
        Below are your temporary login credentials:
      </p>
      
      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
          <tr><td style="color: #6b7280; padding: 8px 0;">Email ID</td><td style="text-align: right; font-weight: bold; color: #111827;">{to_email}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Temporary Password</td><td style="text-align: right; font-weight: bold; color: #2563eb; font-family: monospace;">{temp_password}</td></tr>
        </table>
      </div>

      <div style="margin: 24px 0; text-align: center;">
        <a href="{settings.FRONTEND_URL.rstrip('/')}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Log In to Portal
        </a>
      </div>

      <p style="color: #6b7280; line-height: 1.6; font-size: 13px; margin: 16px 0 0;">
        Please log in using these credentials and verify/update your password in your Profile Settings as soon as possible.
      </p>
    """
    html = _wrap_in_responsive_layout(inner_html, subtitle="")
    return send_email(to_email, subject, html)


def send_association_email(to_email: str, full_name: str, community_name: str, role_name: str) -> bool:
    """Send email when added to an association"""
    subject = f"You have been added to {community_name} on NestBloq Portal"
    role_label = role_name.replace('_', ' ').title()
    inner_html = f"""
      <h2 style="margin: 0 0 16px; font-size: 22px; font-weight: bold; color: #111827;">Hello, {full_name}! </h2>
      <p style="color: #4b5563; line-height: 1.6; font-size: 15px; margin: 0 0 16px;">
        You have been added to the community <strong>{community_name}</strong> as a <strong>{role_label}</strong> on the NestBloq Portal.
      </p>
      <p style="color: #4b5563; line-height: 1.6; font-size: 15px; margin: 0 0 24px;">
        Since you already have a registered account on NestBloq Portal, you can log in using your existing credentials.
      </p>
      <div style="margin: 24px 0; text-align: center;">
        <a href="{settings.FRONTEND_URL.rstrip('/')}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Log In to Portal
        </a>
      </div>
      <p style="color: #6b7280; line-height: 1.6; font-size: 13px; margin: 16px 0 0;">
        After logging in, you can switch to <strong>{community_name}</strong> using the community selector dropdown in the Topbar.
      </p>
    """
    html = _wrap_in_responsive_layout(inner_html, subtitle="")
    return send_email(to_email, subject, html)


def send_pool_status_email(
    to_email: str,
    amenity_name: str,
    community_name: str,
    pool_open: bool,
    tentative_date: str = None
) -> bool:
    """Send pool open/closed status change notification email"""
    subject = f"NestBloq Portal — {amenity_name} Status Update in {community_name}"
    
    if pool_open:
        status_banner = " Pool is NOW OPEN!"
        status_color = "#065f46"  # Dark green
        status_bg = "#d1fae5"     # Light green
        status_border = "#a7f3d0"
        status_details = f"Great news! The pool/amenity <strong>{amenity_name}</strong> is now open and available for bookings."
    else:
        status_banner = "⚠️ Pool is TEMPORARILY CLOSED"
        status_color = "#991b1b"  # Dark red
        status_bg = "#fee2e2"     # Light red
        status_border = "#fecaca"
        if tentative_date:
            status_details = f"The pool/amenity <strong>{amenity_name}</strong> is temporarily closed. It is tentatively scheduled to reopen on <strong>{tentative_date}</strong>."
        else:
            status_details = f"The pool/amenity <strong>{amenity_name}</strong> is temporarily closed until further notice."

    inner_html = f"""
      <div style="background: {status_bg}; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: {status_color}; font-weight: bold; font-size: 18px; border: 1px solid {status_border};">
        {status_banner}
      </div>
      <p style="font-size: 15px; color: #111827; margin: 0 0 12px;">Hello,</p>
      <p style="color: #4b5563; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
        This is an official update regarding the amenities in your community <strong>{community_name}</strong>.
      </p>
      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb; border-left: 4px solid {status_color};">
        <p style="margin: 0; color: #374151; line-height: 1.6; font-size: 15px;">
          {status_details}
        </p>
      </div>
      <div style="margin: 24px 0; text-align: center;">
        <a href="{settings.FRONTEND_URL.rstrip('/')}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Log In to Portal
        </a>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html)
    return send_email(to_email, subject, html)


def send_service_request_created_email(
    to_email: str,
    recipient_name: str,
    request_id: int,
    title: str,
    service_type: str,
    priority: str,
    community_name: str,
    is_admin: bool = False
) -> bool:
    """Send email confirmation/notification when a service request is created"""
    subject = f"NestBloq Portal — New Service Request #{request_id}: {title}"
    if is_admin:
        banner = "⚠️ New Service Request Submitted"
        banner_color = "#1e3a8a"  # Dark blue
        banner_bg = "#dbeafe"     # Light blue
        banner_border = "#bfdbfe"
        heading = "A new service request has been submitted in your community."
    else:
        banner = " Service Request Submitted"
        banner_color = "#065f46"  # Dark green
        banner_bg = "#d1fae5"     # Light green
        banner_border = "#a7f3d0"
        heading = "Your service request has been successfully submitted."

    inner_html = f"""
      <div style="background: {banner_bg}; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: {banner_color}; font-weight: bold; font-size: 18px; border: 1px solid {banner_border};">
        {banner}
      </div>
      <p style="font-size: 15px; color: #111827; margin: 0 0 12px;">Hello {recipient_name},</p>
      <p style="color: #4b5563; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
        {heading}
      </p>
      
      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
          <tr><td style="color: #6b7280; padding: 8px 0;">Request ID</td><td style="text-align: right; font-weight: bold; color: #111827;">#{request_id}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Title</td><td style="text-align: right; color: #111827;">{title}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Category</td><td style="text-align: right; color: #111827;">{service_type}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Priority</td><td style="text-align: right; font-weight: bold; color: {'#dc2626' if priority == 'URGENT' or priority == 'HIGH' else '#059669'};">{priority}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Community</td><td style="text-align: right; color: #111827;">{community_name}</td></tr>
        </table>
      </div>

      <div style="margin: 24px 0; text-align: center;">
        <a href="{settings.FRONTEND_URL.rstrip('/')}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          View Request Details
        </a>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html)
    return send_email(to_email, subject, html)


def send_service_request_status_update_email(
    to_email: str,
    recipient_name: str,
    request_id: int,
    title: str,
    old_status: str,
    new_status: str,
    community_name: str,
    note: str = None
) -> bool:
    """Send email update to resident when their service request status changes"""
    subject = f"NestBloq Portal — Service Request #{request_id} Updated: {new_status}"
    
    # Custom color/banner based on status
    status_bg = {
        "OPEN": "#f3f4f6",
        "APPROVED": "#d1fae5",
        "IN_PROGRESS": "#dbeafe",
        "VENDOR_ASSIGNED": "#f3e8ff",
        "ON_HOLD": "#fef3c7",
        "CLOSED": "#e0f2fe",
        "CANCELLED": "#fee2e2",
    }
    status_color = {
        "OPEN": "#4b5563",
        "APPROVED": "#065f46",
        "IN_PROGRESS": "#1e3a8a",
        "VENDOR_ASSIGNED": "#5b21b6",
        "ON_HOLD": "#92400e",
        "CLOSED": "#075985",
        "CANCELLED": "#991b1b",
    }
    status_border = {
        "OPEN": "#e5e7eb",
        "APPROVED": "#a7f3d0",
        "IN_PROGRESS": "#bfdbfe",
        "VENDOR_ASSIGNED": "#e9d5ff",
        "ON_HOLD": "#fde68a",
        "CLOSED": "#bae6fd",
        "CANCELLED": "#fecaca",
    }
    bg = status_bg.get(new_status, "#f3f4f6")
    color = status_color.get(new_status, "#4b5563")
    border = status_border.get(new_status, "#e5e7eb")
    
    note_section = ""
    if note:
        note_section = f"""
        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb; border-left: 4px solid #2563eb;">
          <p style="margin: 0; color: #4b5563; font-size: 13px; font-weight: bold; text-transform: uppercase;">Latest Update/Note</p>
          <p style="margin: 8px 0 0; color: #111827; font-size: 14px; line-height: 1.5;">{note}</p>
        </div>
        """

    inner_html = f"""
      <div style="background: {bg}; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: {color}; font-weight: bold; font-size: 18px; border: 1px solid {border};">
        ⚠️ Request Updated to {new_status.replace('_', ' ')}
      </div>
      <p style="font-size: 15px; color: #111827; margin: 0 0 12px;">Hello {recipient_name},</p>
      <p style="color: #4b5563; line-height: 1.6; font-size: 14px; margin: 0 0 20px;">
        The status of your service request in <strong>{community_name}</strong> has been updated.
      </p>

      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #374151;">
          <tr><td style="color: #6b7280; padding: 8px 0;">Request ID</td><td style="text-align: right; font-weight: bold; color: #111827;">#{request_id}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Title</td><td style="text-align: right; color: #111827;">{title}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">Previous Status</td><td style="text-align: right; color: #6b7280; text-decoration: line-through;">{old_status.replace('_', ' ')}</td></tr>
          <tr><td style="color: #6b7280; padding: 8px 0; border-top: 1px solid #e5e7eb;">New Status</td><td style="text-align: right; font-weight: bold; color: {color};">{new_status.replace('_', ' ')}</td></tr>
        </table>
      </div>

      {note_section}

      <div style="margin: 24px 0; text-align: center;">
        <a href="{settings.FRONTEND_URL.rstrip('/')}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block;">
          View Full Progress History
        </a>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html)
    return send_email(to_email, subject, html)