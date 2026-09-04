import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Group, Circle, Polygon

def create_role_diagram():
    """Generates a clean vector diagram for Role Hierarchy in Condo System"""
    d = Drawing(460, 160)
    
    # Background Box
    d.add(Rect(0, 0, 460, 160, fillColor=colors.HexColor("#F8FAFC"), strokeColor=colors.HexColor("#E2E8F0"), strokeWidth=1, rx=8, ry=8))
    
    # Nodes
    # 1. Super Admin (Top)
    d.add(Rect(165, 120, 130, 28, fillColor=colors.HexColor("#4F46E5"), strokeColor=colors.HexColor("#4338CA"), rx=4, ry=4))
    d.add(String(230, 130, "System Super Admin", textAnchor="middle", fontName="Helvetica-Bold", fontSize=9, fillColor=colors.white))
    
    # Line down
    d.add(Line(230, 120, 230, 105, strokeColor=colors.HexColor("#94A3B8"), strokeWidth=1.5))
    d.add(Line(110, 105, 350, 105, strokeColor=colors.HexColor("#94A3B8"), strokeWidth=1.5))
    
    # 2. Board Directors
    d.add(Line(110, 105, 110, 92, strokeColor=colors.HexColor("#94A3B8"), strokeWidth=1.5))
    d.add(Rect(45, 64, 130, 28, fillColor=colors.HexColor("#0F172A"), strokeColor=colors.HexColor("#1E293B"), rx=4, ry=4))
    d.add(String(110, 74, "Board Directors (COA)", textAnchor="middle", fontName="Helvetica-Bold", fontSize=8.5, fillColor=colors.white))
    
    # 3. CAM Property Manager
    d.add(Line(350, 105, 350, 92, strokeColor=colors.HexColor("#94A3B8"), strokeWidth=1.5))
    d.add(Rect(285, 64, 130, 28, fillColor=colors.HexColor("#0284C7"), strokeColor=colors.HexColor("#0369A1"), rx=4, ry=4))
    d.add(String(350, 74, "CAM Property Manager", textAnchor="middle", fontName="Helvetica-Bold", fontSize=8.5, fillColor=colors.white))
    
    # Connectors to Bottom Row
    d.add(Line(110, 64, 110, 48, strokeColor=colors.HexColor("#CBD5E1"), strokeWidth=1))
    d.add(Line(350, 64, 350, 48, strokeColor=colors.HexColor("#CBD5E1"), strokeWidth=1))
    d.add(Line(60, 48, 400, 48, strokeColor=colors.HexColor("#CBD5E1"), strokeWidth=1))
    
    # Bottom Roles
    bottom_roles = [
        ("Unit Owners", 15),
        ("Tenants", 115),
        ("Front Desk Guard", 215),
        ("Service Vendors", 325)
    ]
    for label, x_pos in bottom_roles:
        d.add(Line(x_pos + 42, 48, x_pos + 42, 36, strokeColor=colors.HexColor("#CBD5E1"), strokeWidth=1))
        d.add(Rect(x_pos, 10, 84, 24, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#CBD5E1"), rx=3, ry=3))
        d.add(String(x_pos + 42, 18, label, textAnchor="middle", fontName="Helvetica-Bold", fontSize=7.5, fillColor=colors.HexColor("#334155")))
        
    return d

def create_workflow_diagram():
    """Generates a High-Rise Visitor & Elevator Workflow Diagram"""
    d = Drawing(460, 110)
    d.add(Rect(0, 0, 460, 110, fillColor=colors.HexColor("#F8FAFC"), strokeColor=colors.HexColor("#E2E8F0"), strokeWidth=1, rx=8, ry=8))
    
    steps = [
        ("1. Request Pass / Slot", "Resident app generates OTP or reserves elevator"),
        ("2. Security Scan", "Front desk concierge verifies OTP / Booking"),
        ("3. Access Granted", "Gate barrier opens / Elevator cab unlocked"),
        ("4. Audit Log", "Entry timestamp saved in COA cloud ledger")
    ]
    
    for i, (title, desc) in enumerate(steps):
        x = 12 + i * 112
        d.add(Rect(x, 20, 102, 70, fillColor=colors.HexColor("#FFFFFF"), strokeColor=colors.HexColor("#CBD5E1"), rx=4, ry=4))
        # Step header
        d.add(Rect(x, 66, 102, 24, fillColor=colors.HexColor("#EEF2FF"), strokeColor=colors.HexColor("#C7D2FE"), rx=3, ry=3))
        d.add(String(x + 51, 74, title, textAnchor="middle", fontName="Helvetica-Bold", fontSize=7.5, fillColor=colors.HexColor("#3730A3")))
        # Step desc
        d.add(String(x + 51, 44, desc[:22], textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
        d.add(String(x + 51, 32, desc[22:], textAnchor="middle", fontName="Helvetica", fontSize=6.5, fillColor=colors.HexColor("#475569")))
        
        # Arrow
        if i < 3:
            d.add(Line(x + 102, 55, x + 112, 55, strokeColor=colors.HexColor("#4F46E5"), strokeWidth=2))
            
    return d

def build_pdf(output_pdf_path):
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=0.5*inch,
        rightMargin=0.5*inch,
        topMargin=0.6*inch,
        bottomMargin=0.6*inch
    )

    styles = getSampleStyleSheet()
    
    PRIMARY = colors.HexColor("#4F46E5")     # Indigo 600
    SECONDARY = colors.HexColor("#0F172A")   # Slate 900
    TEXT_COLOR = colors.HexColor("#334155")  # Slate 700
    ACCENT_BG = colors.HexColor("#F1F5F9")   # Slate 100
    BORDER_COLOR = colors.HexColor("#CBD5E1")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY,
        spaceAfter=4
    )
    
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=14,
        textColor=SECONDARY,
        spaceAfter=10
    )

    section_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    sub_style = ParagraphStyle(
        'SubHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=PRIMARY,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyTextCustom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_COLOR,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'BulletCustom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_COLOR,
        leftIndent=12,
        spaceAfter=3
    )

    story = []

    # Title & Metadata
    story.append(Paragraph("High Level Requirement & Architecture Document for Condo Management (COA)", title_style))
    story.append(Paragraph("<b>Project:</b> Condominium Owners Association (COA) Platform &nbsp;&nbsp;|&nbsp;&nbsp; <b>Client:</b> Prodlutions LLC &nbsp;&nbsp;|&nbsp;&nbsp; <b>Marketplace:</b> US & Global", meta_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceBefore=0, spaceAfter=8))

    # Diagram 1: Role Hierarchy
    story.append(Paragraph("<b>System Architecture & User Role Mapping Overview:</b>", sub_style))
    story.append(create_role_diagram())
    story.append(Spacer(1, 8))

    # Section 1: Security & Compliance
    story.append(Paragraph("Section 1: Data Security, Privacy & PCI Compliance", section_style))
    security_bullets = [
        "<b>Email & Phone Verification:</b> Email address must be verified. Phone number verification via SMS/OTP is mandatory before adding bank accounts or credit cards.",
        "<b>PCI-DSS Vault Encryption:</b> Bank account and credit card details must be tokenized and encrypted, displaying only the last 4 digits.",
        "<b>Payment Transaction Security:</b> Every payment transaction requires SMS/OTP step verification for authorization.",
        "<b>Data Isolation (Multi-Tenancy):</b> COA Members and Board Directors cannot see data of other COAs. Admin cannot view unassociated communities.",
        "<b>Audit Trail:</b> System must maintain encrypted audit logs for logins, role changes, and financial transactions."
    ]
    for b in security_bullets:
        story.append(Paragraph(f"• {b}", bullet_style))

    # Section 2: High-Rise System Overview
    story.append(Paragraph("Section 2: High-Rise Condo Operations & Scope", section_style))
    overview_bullets = [
        "<b>US Condominium Act Compliance:</b> Meets requirements for Florida Chapter 718, Davis-Stirling Act, and Fair Housing Act (FHA).",
        "<b>Shared Asset Management:</b> Specialized tracking for elevators, reserve funds, parking bays, storage lockers, and package rooms.",
        "<b>Multi-Building Support:</b> Support for multi-tower complexes sharing central clubhouse and gate facilities."
    ]
    for b in overview_bullets:
        story.append(Paragraph(f"• {b}", bullet_style))

    # Section 3: Client Types & Web Experience
    story.append(Paragraph("Section 3: Types of Condo Clients & Web Experiences", section_style))
    client_bullets = [
        "<b>Central Portal vs Whitelabel:</b> Clients can use central portal (vhoas.com/condo) or dedicated custom whitelabel domains.",
        "<b>Verification Access Tiers:</b> Non-verified members have restricted view; verified unit owners/tenants have full feature access based on assigned profile.",
        "<b>Role Switching:</b> Multi-unit owners or board members can seamlessly toggle between Board View and Resident View."
    ]
    for b in client_bullets:
        story.append(Paragraph(f"• {b}", bullet_style))

    # Section 4: Role Hierarchy Details
    story.append(Paragraph("Section 4: User Profile & Role Permissions Matrix", section_style))
    role_rows = [
        [Paragraph("<b>Role</b>", body_style), Paragraph("<b>Target User</b>", body_style), Paragraph("<b>Key Permissions & Capabilities</b>", body_style)],
        [Paragraph("<b>Super Admin</b>", body_style), Paragraph("VHOAS Team", body_style), Paragraph("Global platform configuration, client onboarding, billing, system audit logs.", body_style)],
        [Paragraph("<b>CAM Property Manager</b>", body_style), Paragraph("Licensed Agency", body_style), Paragraph("Work orders, Estoppel Certificates, vendor dispatch, dues invoicing, COI verification.", body_style)],
        [Paragraph("<b>Board Directors</b>", body_style), Paragraph("President/Treasurer", body_style), Paragraph("Operating budget approval, reserve funds, E-voting, board meeting minutes, bylaws.", body_style)],
        [Paragraph("<b>Unit Owner</b>", body_style), Paragraph("Homeowner", body_style), Paragraph("Monthly dues payment, board proxy voting, ARC remodel requests, tenant invitations.", body_style)],
        [Paragraph("<b>Resident / Tenant</b>", body_style), Paragraph("Occupant", body_style), Paragraph("Visitor OTP passes, freight elevator booking, package tracking, amenity bookings.", body_style)],
        [Paragraph("<b>Front Desk Concierge</b>", body_style), Paragraph("Lobby Security", body_style), Paragraph("Guest OTP scanner, delivery parcel logging, move-in elevator verification, guest parking tags.", body_style)],
        [Paragraph("<b>Service Vendor</b>", body_style), Paragraph("Contractors", body_style), Paragraph("Work order status updates, invoice submission, COI document upload.", body_style)]
    ]
    t_roles = Table(role_rows, colWidths=[1.1*inch, 1.1*inch, 4.2*inch])
    t_roles.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor("#EEF2FF")),
        ('TEXTCOLOR', (0,0), (-1,0), SECONDARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(t_roles)
    story.append(Spacer(1, 6))

    # Workflow Diagram
    story.append(Paragraph("<b>Visitor & Elevator Reservation Workflow:</b>", sub_style))
    story.append(create_workflow_diagram())
    story.append(Spacer(1, 8))

    # Section 5: High-Rise Gate & Visitor Pass
    story.append(Paragraph("Section 5: High-Rise Gate Access & Visitor OTP System", section_style))
    story.append(Paragraph("• <b>Guest Pass Generation:</b> Residents generate 6-digit OTPs or QR passes for guests and delivery drivers via app.", bullet_style))
    story.append(Paragraph("• <b>Concierge Verification Interface:</b> Front desk guard scans or enters OTP to validate visitor name, unit destination, and vehicle tag.", bullet_style))
    story.append(Paragraph("• <b>Real-time Entry Alerts:</b> Resident receives instant app push notification when guest enters lobby.", bullet_style))

    # Section 6: Freight Elevator & Move-In Scheduler
    story.append(Paragraph("Section 6: Freight Elevator & Move-In / Move-Out Reservation", section_style))
    story.append(Paragraph("• <b>Slot Reservations:</b> Unit owners/tenants book 2-hour or 4-hour freight elevator slots prior to moving truck arrival.", bullet_style))
    story.append(Paragraph("• <b>Move Deposit Escrow:</b> Automated $250 refundable damage deposit hold via credit card prior to slot confirmation.", bullet_style))
    story.append(Paragraph("• <b>Pre/Post Checklist:</b> Property manager completes digital inspection log before returning deposit.", bullet_style))

    # Section 7: Front-Desk Parcel Room
    story.append(Paragraph("Section 7: Front-Desk Parcel Room & Delivery Logging", section_style))
    story.append(Paragraph("• <b>Barcode Delivery Scanning:</b> Concierge scans package tracking barcodes (FedEx, UPS, Amazon) auto-matching unit resident.", bullet_style))
    story.append(Paragraph("• <b>Automated SMS/Email Alert:</b> Immediate notification sent to resident with pickup QR code.", bullet_style))
    story.append(Paragraph("• <b>Digital Sign-Out:</b> Resident signs touchscreen or scans QR at front desk upon package collection.", bullet_style))

    # Section 8: Financial Ledger & Dues
    story.append(Paragraph("Section 8: Financial Ledger, Dues Collection & Reserve Funds", section_style))
    story.append(Paragraph("• <b>US ACH & India Bank Flows:</b> Supports US ACH auto-debit via Stripe/Plaid to COA Bank Account, and Indian local bank flows for global properties.", bullet_style))
    story.append(Paragraph("• <b>Operating vs Reserve Fund Accounting:</b> Automated split of incoming assessment dues between General Operating Fund and Capital Reserve Account.", bullet_style))
    story.append(Paragraph("• <b>Automated Late Fees:</b> Grace period logic (e.g. $50 fee after 5th of month) auto-added to checkout balance.", bullet_style))

    # Section 9: Estoppel Certificates
    story.append(Paragraph("Section 9: Estoppel Certificates & Resale Disclosures", section_style))
    story.append(Paragraph("• <b>Title Company Portal:</b> Real estate title companies request official Estoppel certificates online.", bullet_style))
    story.append(Paragraph("• <b>Instant Generation:</b> Auto-populates outstanding dues, pending special assessments, and open violations for title clearance.", bullet_style))

    # Section 10: Violations
    story.append(Paragraph("Section 10: Violation Tracking & Fine Appeal Hearings", section_style))
    story.append(Paragraph("• <b>Violation Form:</b> Photo attachments, date, description, and fine amount generated by Board or CAM Manager.", bullet_style))
    story.append(Paragraph("• <b>Status Tracking:</b> Open, Disputed, Paid, Cancelled.", bullet_style))
    story.append(Paragraph("• <b>30-Day Dispute Window:</b> Member can submit dispute appeal with evidence within 30 days for Board hearing.", bullet_style))

    # Section 11: Technical Specs
    story.append(Paragraph("Section 11: Technical Specifications & AWS Infrastructure", section_style))
    tech_bullets = [
        "<b>Frontend:</b> React, Vite, Tailwind CSS, Axios.",
        "<b>Backend:</b> Python FastAPI, SQLAlchemy ORM, PostgreSQL (AWS RDS).",
        "<b>Security:</b> OAuth2 JWT tokens, Captcha integration on auth pages, SSL encryption, PCI-compliant payment gateways (PayPal/Stripe).",
        "<b>Modular Codebase:</b> Tenant-isolated schemas, reusable UI components, whitelabel branding support."
    ]
    for b in tech_bullets:
        story.append(Paragraph(f"• {b}", bullet_style))

    def add_header_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica-Bold", 8)
        canvas.setFillColor(colors.HexColor("#64748B"))
        # Header
        canvas.drawString(0.5*inch, 10.5*inch, "Prodlutions LLC Confidential")
        canvas.drawRightString(8.0*inch, 10.5*inch, "High Level Requirement Document — Condo Management System v1")
        canvas.setStrokeColor(BORDER_COLOR)
        canvas.setLineWidth(0.5)
        canvas.line(0.5*inch, 10.42*inch, 8.0*inch, 10.42*inch)
        # Footer
        page_num = canvas.getPageNumber()
        canvas.setFont("Helvetica", 8)
        canvas.drawString(0.5*inch, 0.4*inch, "Confidential — Prodlutions LLC & VHOAS Platform")
        canvas.drawRightString(8.0*inch, 0.4*inch, f"Page {page_num}")
        canvas.restoreState()

    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    print(f"Successfully generated Detailed Requirement PDF at: {output_pdf_path}")

if __name__ == '__main__':
    out_1 = r"d:\Vhoa_Management\Condo_Detailed_Requirement_Document_v1.pdf"
    out_2 = r"C:\Users\tanuj\.gemini\antigravity-ide\brain\1e1a8b28-8e20-45bf-b995-d9f59914b74a\Condo_Detailed_Requirement_Document_v1.pdf"
    build_pdf(out_1)
    build_pdf(out_2)
