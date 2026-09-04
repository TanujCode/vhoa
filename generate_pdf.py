import os
import re
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def build_pdf(md_file_path, output_pdf_path):
    with open(md_file_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=letter,
        leftMargin=0.6*inch,
        rightMargin=0.6*inch,
        topMargin=0.6*inch,
        bottomMargin=0.6*inch
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette
    PRIMARY = colors.HexColor("#4F46E5")     # Indigo 600
    SECONDARY = colors.HexColor("#0F172A")   # Slate 900
    TEXT_COLOR = colors.HexColor("#334155")  # Slate 700
    ACCENT_BG = colors.HexColor("#F8FAFC")   # Slate 50
    BORDER_COLOR = colors.HexColor("#E2E8F0")

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=6
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=SECONDARY,
        spaceAfter=15
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=19,
        textColor=SECONDARY,
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_COLOR,
        spaceAfter=6
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=TEXT_COLOR,
        leftIndent=15,
        spaceAfter=4
    )

    code_style = ParagraphStyle(
        'Code_Custom',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
        backColor=ACCENT_BG,
        borderColor=BORDER_COLOR,
        borderWidth=0.5,
        borderPadding=6,
        spaceBefore=6,
        spaceAfter=6
    )

    story = []

    lines = md_text.split('\n')
    in_code_block = False
    code_lines = []

    for line in lines:
        raw_line = line.rstrip()

        # Handle Code Blocks ```
        if raw_line.startswith('```'):
            if in_code_block:
                # End of code block
                code_text = "<br/>".join(code_lines).replace(" ", "&nbsp;")
                story.append(Paragraph(code_text, code_style))
                code_lines = []
                in_code_block = False
            else:
                in_code_block = True
            continue

        if in_code_block:
            safe_line = raw_line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            code_lines.append(safe_line)
            continue

        if not raw_line.strip():
            story.append(Spacer(1, 4))
            continue

        # Horizontal Rule ---
        if raw_line.strip() == '---':
            story.append(Spacer(1, 4))
            story.append(HRFlowable(width="100%", thickness=1, color=BORDER_COLOR, spaceBefore=4, spaceAfter=8))
            continue

        # Convert Markdown formatting to ReportLab HTML tags
        # Bold **text** -> <b>text</b>
        formatted_line = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', raw_line)
        # Italic *text* or _text_ -> <i>text</i>
        formatted_line = re.sub(r'\*(.*?)\*', r'<i>\1</i>', formatted_line)
        # Inline Code `text` -> <font name="Courier">\1</font>
        formatted_line = re.sub(r'`(.*?)`', r'<font name="Courier" color="#4F46E5">\1</font>', formatted_line)

        # Headings
        if raw_line.startswith('# '):
            story.append(Paragraph(formatted_line[2:], title_style))
            story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceBefore=2, spaceAfter=10))
        elif raw_line.startswith('## '):
            story.append(Paragraph(formatted_line[3:], subtitle_style))
        elif raw_line.startswith('### '):
            story.append(Paragraph(formatted_line[4:], h1_style))
        elif raw_line.startswith('#### '):
            story.append(Paragraph(formatted_line[5:], h2_style))
        elif raw_line.startswith('* ') or raw_line.startswith('- '):
            item_text = formatted_line[2:]
            bullet_p = f"• {item_text}"
            story.append(Paragraph(bullet_p, bullet_style))
        else:
            story.append(Paragraph(formatted_line, body_style))

    def add_header_footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#94A3B8"))
        # Header
        canvas.drawString(0.6*inch, 10.5*inch, "Condominium Owners Association (COA) Management System — Specification Document")
        canvas.setStrokeColor(BORDER_COLOR)
        canvas.setLineWidth(0.5)
        canvas.line(0.6*inch, 10.42*inch, 7.9*inch, 10.42*inch)
        # Footer
        page_num = canvas.getPageNumber()
        canvas.drawString(0.6*inch, 0.4*inch, "CONFIDENTIAL — FOR INTERNAL & CLIENT USE ONLY")
        canvas.drawRightString(7.9*inch, 0.4*inch, f"Page {page_num}")
        canvas.restoreState()

    doc.build(story, onFirstPage=add_header_footer, onLaterPages=add_header_footer)
    print(f"Successfully generated PDF at: {output_pdf_path}")

if __name__ == '__main__':
    md_path = r"C:\Users\tanuj\.gemini\antigravity-ide\brain\1e1a8b28-8e20-45bf-b995-d9f59914b74a\condo_management_system_spec.md"
    output_pdf_1 = r"d:\Vhoa_Management\Condo_Management_System_Specification.pdf"
    output_pdf_2 = r"C:\Users\tanuj\.gemini\antigravity-ide\brain\1e1a8b28-8e20-45bf-b995-d9f59914b74a\Condo_Management_System_Specification.pdf"
    build_pdf(md_path, output_pdf_1)
    build_pdf(md_path, output_pdf_2)
