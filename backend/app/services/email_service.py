import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
        msg["To"]      = to_email

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, to_email, msg.as_string())

        print(f"Email sent to {to_email}")
        return True

    except Exception as e:
        print(f"Email failed: {e}")
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

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D1B2A; color: #ffffff; border-radius: 16px; overflow: hidden;">
      <div style="background: #162535; padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff;">
          <span style="color: #14B8A6;">V</span>HOAS
        </h1>
        <p style="margin: 8px 0 0; color: #9CA3AF; font-size: 14px;">HOA Management System</p>
      </div>

      <div style="padding: 40px 30px;">
        <div style="background: {status_color}; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #000000; font-weight: bold; font-size: 18px;">
          {status_banner}
        </div>
        <p>Hello,</p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          An amenity booking request has been submitted for <strong>{community_name}</strong>.
        </p>

        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
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

      <div style="background: #162535; padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="margin: 0; color: #6B7280; font-size: 12px;">© 2026 VHOAS</p>
      </div>
    </div>
    """
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
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D1B2A; color: #ffffff; border-radius: 16px; overflow: hidden;">
      <div style="background: #162535; padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff;">
          <span style="color: #14B8A6;">V</span>HOAS
        </h1>
        <p style="margin: 8px 0 0; color: #9CA3AF; font-size: 14px;">HOA Management System</p>
      </div>

      <div style="padding: 40px 30px;">
        <div style="background: #14B8A6; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #000000; font-weight: bold; font-size: 18px;">
          💳 Payment Received & Confirmed
        </div>
        <p>Hello,</p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Your payment of <strong>${fee_amount}</strong> for booking the amenity <strong>{amenity_name}</strong> in <strong>{community_name}</strong> has been successfully received and confirmed.
        </p>

        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
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

      <div style="background: #162535; padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="margin: 0; color: #6B7280; font-size: 12px;">© 2026 VHOAS</p>
      </div>
    </div>
    """
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
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D1B2A; color: #ffffff; border-radius: 16px; overflow: hidden;">
      <div style="background: #162535; padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff;">
          <span style="color: #14B8A6;">V</span>HOAS
        </h1>
        <p style="margin: 8px 0 0; color: #9CA3AF; font-size: 14px;">HOA Management System</p>
      </div>

      <div style="padding: 40px 30px;">
        <div style="background: #14B8A6; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #000000; font-weight: bold; font-size: 18px;">
          💳 Payment Successful
        </div>
        <p>Hello {payer_name},</p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          Your payment has been successfully processed for <strong>{community_name}</strong>.
        </p>

        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="color: #9CA3AF; padding: 8px 0;">Payment Reason</td><td style="text-align: right; font-weight: bold; color: #ffffff;">{reason.replace('_', ' ').title()}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Amount Paid</td><td style="text-align: right; font-weight: bold; color: #14B8A6;">${amount}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Payment Method</td><td style="text-align: right; color: #ffffff;">{payment_method.replace('_', ' ').title()}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Transaction Ref</td><td style="text-align: right; color: #ffffff;">{transaction_id}</td></tr>
          </table>
        </div>
        {escrow_info}
      </div>

      <div style="background: #162535; padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="margin: 0; color: #6B7280; font-size: 12px;">© 2026 VHOAS</p>
      </div>
    </div>
    """
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
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D1B2A; color: #ffffff; border-radius: 16px; overflow: hidden;">
      <div style="background: #162535; padding: 30px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <h1 style="margin: 0; font-size: 24px; color: #ffffff;">
          <span style="color: #14B8A6;">V</span>HOAS
        </h1>
        <p style="margin: 8px 0 0; color: #9CA3AF; font-size: 14px;">HOA Management System</p>
      </div>

      <div style="padding: 40px 30px;">
        <div style="background: #F59E0B; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center; color: #000000; font-weight: bold; font-size: 18px;">
          ⏰ Payment Reminder: {days_left} Days Left
        </div>
        <p>Dear {payer_name},</p>
        <p style="color: #9CA3AF; line-height: 1.6;">
          This is a friendly reminder that you have an upcoming payment due for <strong>{community_name}</strong>.
        </p>

        <div style="background: #162535; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr><td style="color: #9CA3AF; padding: 8px 0;">Description</td><td style="text-align: right; font-weight: bold; color: #ffffff;">{reason.replace('_', ' ').title()}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Amount Due</td><td style="text-align: right; font-weight: bold; color: #F87171;">${amount}</td></tr>
            <tr><td style="color: #9CA3AF; padding: 8px 0; border-top: 1px solid rgba(255,255,255,0.05);">Due Date</td><td style="text-align: right; color: #ffffff;">{due_date}</td></tr>
          </table>
        </div>
        <p style="color: #9CA3AF; line-height: 1.6; font-size: 14px;">
          Please log in to the VHOAS portal to complete this payment.
        </p>
      </div>

      <div style="background: #162535; padding: 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
        <p style="margin: 0; color: #6B7280; font-size: 12px;">© 2026 VHOAS</p>
      </div>
    </div>
    """
    return send_email(to_email, subject, html)