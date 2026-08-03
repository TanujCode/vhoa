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
    os.path.abspath(os.path.join(_BASE_DIR, "..", "..", "..", "frontend", "hoa-portal", "public", "logo_dark.png")),
    os.path.abspath(os.path.join(_BASE_DIR, "..", "..", "frontend", "hoa-portal", "public", "logo_dark.png")),
    os.path.abspath(os.path.join(_BASE_DIR, "..", "..", "..", "..", "frontend", "hoa-portal", "public", "logo_dark.png")),
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


def _wrap_in_responsive_layout(inner_html: str, subtitle: str = "HOA Management System") -> str:
    """Wraps inner HTML in a responsive, centered table layout that looks beautiful on mobile email clients."""
    sub_element = f'<p style="margin: 8px 0 0; color: #9CA3AF; font-size: 14px;">{subtitle}</p>' if subtitle else ''
    return f"""
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #050b14; width: 100%; height: 100%; margin: 0; padding: 20px 0; font-family: Arial, sans-serif;">
      <tr>
        <td align="center" valign="top">
          <div style="width: 100%; max-width: 500px; margin: 0 auto; background: #0D1B2A; color: #ffffff; border-radius: 16px; overflow: hidden; text-align: left; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
            
            <!-- Header -->
            <div style="background: #162535; padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <img src="cid:vhoa_logo" alt="VHOA Portal" style="height: 50px; width: auto; display: block; margin: 0 auto;" />
              {sub_element}
            </div>

            <!-- Body Content -->
            {inner_html}

            <!-- Footer -->
            <div style="background: #162535; padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0; color: #6B7280; font-size: 12px;">
                © 2026 VHOA — {subtitle or 'HOA Management System'}
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

def send_otp_email(to_email: str, otp_code: str, otp_type: str, system_name: str = "HOA Management System") -> bool:
    """Send OTP email"""
    type_labels = {
        "email_verify":   "Email Verification",
        "mobile_verify":  "Mobile Verification",
        "password_reset": "Password Reset",
    }
    label = type_labels.get(otp_type, "Verification")
    
    if "rental" in system_name.lower():
        subject = f"Rental Portal — {label} OTP"
        from_name = "NestBloq Rental Management"
    else:
        subject = f"VHOA Portal — {label} OTP"
        from_name = "NestBloq HOA Management"

    inner_html = f"""
      <div style="padding: 40px 30px; text-align: center;">
        <h2 style="margin: 0 0 10px; font-size: 20px; color: #ffffff;">{label}</h2>
        <p style="color: #9CA3AF; margin: 0 0 30px; font-size: 15px;">
          Your one-time verification code is:
        </p>

        <!-- OTP Box - Mobile Friendly -->
        <div style="background: #162535; border: 2px solid #14B8A6; border-radius: 12px; padding: 18px 25px; display: inline-block; margin: 20px 0 30px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #14B8A6; font-family: monospace;">
            {otp_code}
          </span>
        </div>

        <p style="color: #9CA3AF; font-size: 13px; margin: 0;">
          ⏰ This code expires in <strong style="color: #ffffff;">10 minutes</strong>
        </p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="https://nestbloq.vercel.app/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            Log In to Portal
          </a>
        </div>
        <p style="color: #6B7280; font-size: 12px; margin: 16px 0 0;">
          If you did not request this, please ignore this email.
        </p>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html, subtitle=system_name)
    return send_email(to_email, subject, html, from_name=from_name)


def send_welcome_email(to_email: str, full_name: str) -> bool:
    """Registration welcome email"""
    subject = "Welcome to VHOA Portal — HOA Management"
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <h2 style="margin: 0 0 16px; color: #ffffff;">Welcome, {full_name}! </h2>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Your account has been created successfully on VHOA HOA Management System.
        </p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Please verify your email address to get full access to your account.
        </p>
        <div style="margin: 30px 0; padding: 20px; background: #162535; border-radius: 12px; border-left: 4px solid #14B8A6;">
          <p style="margin: 0; color: #9CA3AF; font-size: 14px;">
            Next step: Go to your profile and verify your email address using OTP.
          </p>
        </div>
        <div style="margin: 30px 0; text-align: center;">
          <a href="https://nestbloq.vercel.app/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            Log In to Portal
          </a>
        </div>
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
    subject = f"VHOA Portal — Violation Notice: {violation_type}"
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <div style="background: #7F1D1D; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #ffffff; font-weight: bold;">
          ️ Violation Notice
        </div>
        <p>Dear <strong>{resident_name}</strong>,</p>
        <p style="color: #9CA3AF;">A violation has been issued for your property.</p>

        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; color: #ffffff;">
            <tr><td style="color: #9CA3AF; padding: 8px 0;">Violation Type</td><td style="text-align: right; font-weight: bold;">{violation_type}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Fine Amount</td><td style="text-align: right; font-weight: bold; color: #F87171;">${amount}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Due Date</td><td style="text-align: right;">{due_date}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Remarks</td><td style="text-align: right;">{remarks or 'N/A'}</td></tr>
          </table>
        </div>

        <p style="color: #9CA3AF; font-size: 13px;">
          You have 30 days to dispute this violation through the VHOA portal.
        </p>

        <div style="margin: 30px 0; text-align: center;">
          <a href="https://nestbloq.vercel.app/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            Log In to Portal
          </a>
        </div>
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
    subject = f"VHOA Portal — Amenity Booking Request: {amenity_name}"
    
    if status_type == "CONFIRMED":
        status_label = "Confirmed"
        status_color = "#14B8A6"  # Teal
        status_banner = " Booking Confirmed"
        detail_msg = "Your booking is confirmed! No further action is required."
    else:
        status_label = "Payment Due"
        status_color = "#F59E0B"  # Orange/yellow
        status_banner = "️ Payment Due"
        detail_msg = f"Your booking is pending payment. Please make a payment of <strong>${fee_amount}</strong> by <strong>{payment_due_date}</strong> to confirm your slot."

    inner_html = f"""
      <div style="padding: 40px 30px;">
        <div style="background: {status_color}; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #000000; font-weight: bold; font-size: 18px;">
          {status_banner}
        </div>
        <p>Hello,</p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          An amenity booking request has been submitted for <strong>{community_name}</strong>.
        </p>

        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #ffffff;">
            <tr><td style="color: #9CA3AF; padding: 8px 0;">Amenity</td><td style="text-align: right; font-weight: bold; color: #ffffff;">{amenity_name}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Booked By</td><td style="text-align: right; font-weight: bold; color: #ffffff;">{booked_by_name}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Date</td><td style="text-align: right; color: #ffffff;">{booking_date}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Time Slot</td><td style="text-align: right; color: #ffffff;">{slot_time}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Fee Amount</td><td style="text-align: right; font-weight: bold; color: #14B8A6;">${fee_amount}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Status</td><td style="text-align: right; font-weight: bold; color: {status_color};">{status_label}</td></tr>
          </table>
        </div>

        <p style="color: #9CA3AF; line-height: 1.6; font-size: 14px;">
          {detail_msg}
        </p>

        <div style="margin: 30px 0; text-align: center;">
          <a href="https://nestbloq.vercel.app/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            Log In to Portal
          </a>
        </div>
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
    subject = f"VHOA Portal — Payment Confirmed for {amenity_name}"
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <div style="background: #14B8A6; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #000000; font-weight: bold; font-size: 18px;">
           Payment Received & Confirmed
        </div>
        <p>Hello,</p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Your payment of <strong>${fee_amount}</strong> for booking the amenity <strong>{amenity_name}</strong> in <strong>{community_name}</strong> has been successfully received and confirmed.
        </p>

        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #ffffff;">
            <tr><td style="color: #9CA3AF; padding: 8px 0;">Amenity</td><td style="text-align: right; font-weight: bold; color: #ffffff;">{amenity_name}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Booked By</td><td style="text-align: right; font-weight: bold; color: #ffffff;">{booked_by_name}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Date</td><td style="text-align: right; color: #ffffff;">{booking_date}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Time Slot</td><td style="text-align: right; color: #ffffff;">{slot_time}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Amount Paid</td><td style="text-align: right; font-weight: bold; color: #14B8A6;">${fee_amount}</td></tr>
          </table>
        </div>

        <p style="color: #9CA3AF; line-height: 1.6; font-size: 14px;">
          Enjoy your reservation! Let us know if you have any questions.
        </p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="https://nestbloq.vercel.app/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            Log In to Portal
          </a>
        </div>
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
    subject = f"VHOA Portal — Payment Receipt: {reason.replace('_', ' ').title()}"
    escrow_info = f"<p style='color: #9CA3AF;'>Paid to Escrow Bank: <strong>{escrow_bank}</strong></p>" if escrow_bank else ""
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <div style="background: #14B8A6; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #000000; font-weight: bold; font-size: 18px;">
           Payment Successful
        </div>
        <p>Hello {payer_name},</p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Your payment has been successfully processed for <strong>{community_name}</strong>.
        </p>

        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #ffffff;">
            <tr><td style="color: #9CA3AF; padding: 8px 0;">Payment Reason</td><td style="text-align: right; font-weight: bold; color: #ffffff;">{reason.replace('_', ' ').title()}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Amount Paid</td><td style="text-align: right; font-weight: bold; color: #14B8A6;">${amount}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Payment Method</td><td style="text-align: right; color: #ffffff;">{payment_method.replace('_', ' ').title()}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Transaction Ref</td><td style="text-align: right; color: #ffffff;">{transaction_id}</td></tr>
          </table>
        </div>
        {escrow_info}
        <div style="margin: 30px 0; text-align: center;">
          <a href="https://nestbloq.vercel.app/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            Log In to Portal
          </a>
        </div>
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
    subject = f"VHOA Portal — Reminder: Payment Due in {days_left} Days"
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <div style="background: #F59E0B; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #000000; font-weight: bold; font-size: 18px;">
          ⏰ Payment Reminder: {days_left} Days Left
        </div>
        <p>Dear {payer_name},</p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          This is a friendly reminder that you have an upcoming payment due for <strong>{community_name}</strong>.
        </p>

        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #ffffff;">
            <tr><td style="color: #9CA3AF; padding: 8px 0;">Description</td><td style="text-align: right; font-weight: bold; color: #ffffff;">{reason.replace('_', ' ').title()}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Amount Due</td><td style="text-align: right; font-weight: bold; color: #F87171;">${amount}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Due Date</td><td style="text-align: right; color: #ffffff;">{due_date}</td></tr>
          </table>
        </div>
        <p style="color: #9CA3AF; line-height: 1.6; font-size: 14px;">
          Please log in to the VHOA portal to complete this payment.
        </p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="https://nestbloq.vercel.app/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            Log In to Portal
          </a>
        </div>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html)
    return send_email(to_email, subject, html)


def send_invite_email(to_email: str, full_name: str, temp_password: str, community_name: str, role_name: str) -> bool:
    """Send email invitation to join community"""
    subject = f"Invitation to join {community_name} on VHOA Portal"
    role_label = role_name.replace('_', ' ').title()
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <h2 style="margin: 0 0 16px; color: #ffffff;">Hello, {full_name}! </h2>
        <p style="color: #9CA3AF; line-height: 1.6;">
          You have been invited to join the community <strong>{community_name}</strong> as a <strong>{role_label}</strong> on the VHOA Portal.
        </p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Below are your temporary login credentials:
        </p>
        
        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #ffffff;">
            <tr><td style="color: #9CA3AF; padding: 8px 0;">Email ID</td><td style="text-align: right; font-weight: bold; color: #ffffff;">{to_email}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Temporary Password</td><td style="text-align: right; font-weight: bold; color: #14B8A6; font-family: monospace;">{temp_password}</td></tr>
          </table>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <a href="https://nestbloq.vercel.app/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            Log In to Portal
          </a>
        </div>

        <p style="color: #9CA3AF; line-height: 1.6; font-size: 13px;">
          Please log in using these credentials and verify/update your password in your Profile Settings as soon as possible.
        </p>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html, subtitle="")
    return send_email(to_email, subject, html)


def send_association_email(to_email: str, full_name: str, community_name: str, role_name: str) -> bool:
    """Send email when added to an association"""
    subject = f"You have been added to {community_name} on VHOA Portal"
    role_label = role_name.replace('_', ' ').title()
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <h2 style="margin: 0 0 16px; color: #ffffff;">Hello, {full_name}! </h2>
        <p style="color: #9CA3AF; line-height: 1.6;">
          You have been added to the community <strong>{community_name}</strong> as a <strong>{role_label}</strong> on the VHOA Portal.
        </p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Since you already have a registered account on VHOA Portal, you can log in using your existing credentials.
        </p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="https://nestbloq.vercel.app/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            Log In to Portal
          </a>
        </div>
        <p style="color: #9CA3AF; line-height: 1.6; font-size: 13px;">
          After logging in, you can switch to <strong>{community_name}</strong> using the community selector dropdown in the Topbar.
        </p>
      </div>
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
    subject = f"VHOA Portal — {amenity_name} Status Update in {community_name}"
    
    if pool_open:
        status_banner = " Pool is NOW OPEN!"
        status_color = "#14B8A6"  # Teal
        status_details = f"Great news! The pool/amenity <strong>{amenity_name}</strong> is now open and available for bookings."
    else:
        status_banner = "️ Pool is TEMPORARILY CLOSED"
        status_color = "#EF4444"  # Red
        if tentative_date:
            status_details = f"The pool/amenity <strong>{amenity_name}</strong> is temporarily closed. It is tentatively scheduled to reopen on <strong>{tentative_date}</strong>."
        else:
            status_details = f"The pool/amenity <strong>{amenity_name}</strong> is temporarily closed until further notice."

    inner_html = f"""
      <div style="padding: 40px 30px;">
        <div style="background: {status_color}; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #ffffff; font-weight: bold; font-size: 18px;">
          {status_banner}
        </div>
        <p>Hello,</p>
        <p style="color: #9CA3AF; line-height: 1.6; font-size: 14px;">
          This is an official update regarding the amenities in your community <strong>{community_name}</strong>.
        </p>
        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid {status_color};">
          <p style="margin: 0; color: #ffffff; line-height: 1.6; font-size: 15px;">
            {status_details}
          </p>
        </div>
        <div style="margin: 30px 0; text-align: center;">
          <a href="https://nestbloq.vercel.app/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            Log In to Portal
          </a>
        </div>
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
    subject = f"VHOA Portal — New Service Request #{request_id}: {title}"
    if is_admin:
        banner = "️ New Service Request Submitted"
        banner_color = "#3B82F6"  # Blue
        heading = "A new service request has been submitted in your community."
    else:
        banner = " Service Request Submitted"
        banner_color = "#14B8A6"  # Teal
        heading = "Your service request has been successfully submitted."

    inner_html = f"""
      <div style="padding: 40px 30px;">
        <div style="background: {banner_color}; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #ffffff; font-weight: bold; font-size: 18px;">
          {banner}
        </div>
        <p>Hello {recipient_name},</p>
        <p style="color: #9CA3AF; line-height: 1.6; font-size: 14px;">
          {heading}
        </p>
        
        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #ffffff;">
            <tr><td style="color: #9CA3AF; padding: 8px 0;">Request ID</td><td style="text-align: right; font-weight: bold; color: #ffffff;">#{request_id}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Title</td><td style="text-align: right; color: #ffffff;">{title}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Category</td><td style="text-align: right; color: #ffffff;">{service_type}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Priority</td><td style="text-align: right; font-weight: bold; color: {'#EF4444' if priority == 'URGENT' or priority == 'HIGH' else '#14B8A6'};">{priority}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Community</td><td style="text-align: right; color: #ffffff;">{community_name}</td></tr>
          </table>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <a href="https://nestbloq.vercel.app/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            View Request Details
          </a>
        </div>
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
    subject = f"VHOA Portal — Service Request #{request_id} Updated: {new_status}"
    
    # Custom color/banner based on status
    status_colors = {
        "OPEN": "#9CA3AF",
        "APPROVED": "#10B981",
        "IN_PROGRESS": "#3B82F6",
        "VENDOR_ASSIGNED": "#8B5CF6",
        "ON_HOLD": "#F59E0B",
        "CLOSED": "#14B8A6",
        "CANCELLED": "#EF4444",
    }
    banner_color = status_colors.get(new_status, "#14B8A6")
    
    note_section = ""
    if note:
        note_section = f"""
        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #3B82F6;">
          <p style="margin: 0; color: #9CA3AF; font-size: 13px; font-weight: bold; text-transform: uppercase;">Latest Update/Note</p>
          <p style="margin: 8px 0 0; color: #ffffff; font-size: 14px; line-height: 1.5;">{note}</p>
        </div>
        """

    inner_html = f"""
      <div style="padding: 40px 30px;">
        <div style="background: {banner_color}; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #ffffff; font-weight: bold; font-size: 18px;">
          ️ Request Updated to {new_status.replace('_', ' ')}
        </div>
        <p>Hello {recipient_name},</p>
        <p style="color: #9CA3AF; line-height: 1.6; font-size: 14px;">
          The status of your service request in <strong>{community_name}</strong> has been updated.
        </p>

        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #ffffff;">
            <tr><td style="color: #9CA3AF; padding: 8px 0;">Request ID</td><td style="text-align: right; font-weight: bold; color: #ffffff;">#{request_id}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Title</td><td style="text-align: right; color: #ffffff;">{title}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Previous Status</td><td style="text-align: right; color: #9CA3AF; text-decoration: line-through;">{old_status.replace('_', ' ')}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">New Status</td><td style="text-align: right; font-weight: bold; color: {banner_color};">{new_status.replace('_', ' ')}</td></tr>
          </table>
        </div>

        {note_section}

        <div style="margin: 30px 0; text-align: center;">
          <a href="https://nestbloq.vercel.app/login" style="background-color: #14B8A6; color: #000000; padding: 12px 24px; font-weight: bold; font-size: 15px; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(20, 184, 166, 0.25);">
            View Full Progress History
          </a>
        </div>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html)
    return send_email(to_email, subject, html)