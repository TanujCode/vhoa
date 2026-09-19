import html
from sqlalchemy.orm import Session
from app.models.contact import ContactInquiry
from app.schemas.contact import ContactInquiryCreate
from app.services.email_service import send_email, _wrap_in_responsive_layout


def send_contact_confirmation_email(inquiry: ContactInquiry) -> bool:
    """
    Sends a warm, professional confirmation & thank-you email to the person who submitted the contact form.
    """
    try:
        ref_id = str(inquiry.id)[:8].upper()
        safe_first_name = html.escape(inquiry.first_name)
        safe_subject = html.escape(inquiry.subject)
        safe_message = html.escape(inquiry.message)
        date_str = inquiry.created_at.strftime("%B %d, %Y at %I:%M %p UTC")

        body_html = f"""
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
            <!-- Hero Greeting -->
            <div style="padding: 24px 0 16px 0;">
                <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                    Thank You for Contacting NestBloq!
                </h2>
                <p style="margin: 0; font-size: 15px; color: #475569;">
                    Hi <strong>{safe_first_name}</strong>, we have successfully received your inquiry and our team is already on it.
                </p>
            </div>

            <!-- Inquiry Summary Box -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin: 16px 0 24px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; width: 140px; font-weight: 600;">Reference ID:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace;">#NB-{ref_id}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Topic / Subject:</td>
                        <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">{safe_subject}</td>
                    </tr>
                    <tr>
                        <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Received At:</td>
                        <td style="padding: 6px 0; color: #0f172a;">{date_str}</td>
                    </tr>
                </table>

                <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed #cbd5e1;">
                    <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 6px;">
                        Your Submitted Message:
                    </div>
                    <div style="font-size: 13px; color: #334155; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; white-space: pre-wrap; font-style: italic;">"{safe_message}"</div>
                </div>
            </div>

            <!-- What to Expect Section -->
            <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(168, 85, 247, 0.06)); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #4338ca;">
                    What Happens Next?
                </h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
                    <li style="margin-bottom: 4px;">A dedicated NestBloq specialist has been assigned to your ticket.</li>
                    <li style="margin-bottom: 4px;">We typically reply within <strong>2 to 4 business hours</strong> (Monday–Friday).</li>
                    <li>If your query is urgent, simply reply directly to this email with any extra details.</li>
                </ul>
            </div>

            <!-- Closing -->
            <p style="margin: 20px 0 0 0; font-size: 14px; color: #475569;">
                Best regards,<br/>
                <strong style="color: #0f172a;">The NestBloq Support & Customer Success Team</strong>
            </p>
        </div>
        """

        wrapped = _wrap_in_responsive_layout(
            body_html,
            subtitle="Customer Success & Support"
        )

        email_subject = f"We received your message [Ref: #NB-{ref_id}] — NestBloq"
        return send_email(inquiry.work_email, email_subject, wrapped)

    except Exception as e:
        print(f"[send_contact_confirmation_email] Error sending email: {e}")
        return False


def save_contact_inquiry(data: ContactInquiryCreate, db: Session) -> ContactInquiry:
    """
    Saves the contact inquiry to the database and dispatches a confirmation email.
    """
    inquiry = ContactInquiry(
        first_name=data.first_name,
        last_name=data.last_name,
        work_email=data.work_email,
        phone=data.phone,
        company_name=data.company_name,
        subject=data.subject,
        message=data.message,
        status="new",
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)

    # Trigger confirmation email in background / asynchronously
    send_contact_confirmation_email(inquiry)

    return inquiry
