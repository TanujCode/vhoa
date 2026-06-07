import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


def _send_email_thread(to_email: str, subject: str, html_body: str):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
        msg["To"]      = to_email

        msg.attach(MIMEText(html_body, "html"))

        # Added a 10 second timeout to prevent the thread from hanging indefinitely
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=10) as server:
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())

        print(f"Email sent to {to_email}")
    except Exception as e:
        print(f"Email failed: {e}")


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    # Run SMTP transport asynchronously in a background thread so it doesn't block the request lifecycle
    thread = threading.Thread(target=_send_email_thread, args=(to_email, subject, html_body))
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
              <h1 style="margin: 0; font-size: 24px; color: #ffffff;">
                <span style="color: #14B8A6;">V</span>HOAS
              </h1>
              {sub_element}
            </div>

            <!-- Body Content -->
            {inner_html}

            <!-- Footer -->
            <div style="background: #162535; padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0; color: #6B7280; font-size: 12px;">
                © 2026 VHOAS — HOA Management System
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

def send_otp_email(to_email: str, otp_code: str, otp_type: str) -> bool:
    """Send OTP email"""
    type_labels = {
        "email_verify":   "Email Verification",
        "mobile_verify":  "Mobile Verification",
        "password_reset": "Password Reset",
    }
    label = type_labels.get(otp_type, "Verification")
    subject = f"VHOAS — {label} OTP"

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
        <p style="color: #6B7280; font-size: 12px; margin: 16px 0 0;">
          If you did not request this, please ignore this email.
        </p>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html)
    return send_email(to_email, subject, html)


def send_welcome_email(to_email: str, full_name: str) -> bool:
    """Registration welcome email"""
    subject = "Welcome to VHOAS — HOA Management"
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <h2 style="margin: 0 0 16px; color: #ffffff;">Welcome, {full_name}! 👋</h2>
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
    subject = f"VHOAS — Violation Notice: {violation_type}"
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <div style="background: #7F1D1D; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #ffffff; font-weight: bold;">
          ⚠️ Violation Notice
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
          You have 30 days to dispute this violation through the VHOAS portal.
        </p>
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
    subject = f"VHOAS — Amenity Booking Request: {amenity_name}"
    
    if status_type == "CONFIRMED":
        status_label = "Confirmed"
        status_color = "#14B8A6"  # Teal
        status_banner = "🎉 Booking Confirmed"
        detail_msg = "Your booking is confirmed! No further action is required."
    else:
        status_label = "Payment Due"
        status_color = "#F59E0B"  # Orange/yellow
        status_banner = "⚠️ Payment Due"
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
    subject = f"VHOAS — Payment Confirmed for {amenity_name}"
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <div style="background: #14B8A6; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #000000; font-weight: bold; font-size: 18px;">
          💳 Payment Received & Confirmed
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
    subject = f"VHOAS — Payment Receipt: {reason.replace('_', ' ').title()}"
    escrow_info = f"<p style='color: #9CA3AF;'>Paid to Escrow Bank: <strong>{escrow_bank}</strong></p>" if escrow_bank else ""
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <div style="background: #14B8A6; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #000000; font-weight: bold; font-size: 18px;">
          💳 Payment Successful
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
    subject = f"VHOAS — Reminder: Payment Due in {days_left} Days"
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
          Please log in to the VHOAS portal to complete this payment.
        </p>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html)
    return send_email(to_email, subject, html)


def send_invite_email(to_email: str, full_name: str, temp_password: str, community_name: str, role_name: str) -> bool:
    subject = f"Invitation to join {community_name} on VHOAS"
    role_label = role_name.replace('_', ' ').title()
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <h2 style="margin: 0 0 16px; color: #ffffff;">Hello, {full_name}! 👋</h2>
        <p style="color: #9CA3AF; line-height: 1.6;">
          You have been invited to join the community <strong>{community_name}</strong> as a <strong>{role_label}</strong> on the VHOAS Portal.
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

        <p style="color: #9CA3AF; line-height: 1.6;">
          Please log in using these credentials and verify/update your password in your Profile Settings as soon as possible.
        </p>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html, subtitle="")
    return send_email(to_email, subject, html)


def send_association_email(to_email: str, full_name: str, community_name: str, role_name: str) -> bool:
    subject = f"You have been added to {community_name} on VHOAS"
    role_label = role_name.replace('_', ' ').title()
    inner_html = f"""
      <div style="padding: 40px 30px;">
        <h2 style="margin: 0 0 16px; color: #ffffff;">Hello, {full_name}! 👋</h2>
        <p style="color: #9CA3AF; line-height: 1.6;">
          You have been added to the community <strong>{community_name}</strong> as a <strong>{role_label}</strong> on the VHOAS Portal.
        </p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Since you already have a registered account on VHOAS, you can log in using your existing credentials.
        </p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          After logging in, you can switch to <strong>{community_name}</strong> using the community selector dropdown in the Topbar.
        </p>
      </div>
    """
    html = _wrap_in_responsive_layout(inner_html, subtitle="")
    return send_email(to_email, subject, html)
