# -*- coding: utf-8 -*-
"""
GHMS Proposal - Body PDF (ReportLab)
Merged with cover PDF after generation.
"""

import os, sys, hashlib
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm, cm
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY, TA_RIGHT
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether, HRFlowable, CondPageBreak
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PATHS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FONT_DIR = '/usr/share/fonts/truetype'
OUTPUT_BODY = '/home/z/my-project/scripts/ghms_proposal_body.pdf'
OUTPUT_FINAL = '/home/z/my-project/download/GHMS_Proposal.pdf'
COVER_PDF = '/home/z/my-project/scripts/ghms_proposal_cover.pdf'

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CASCADE PALETTE (auto-generated)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE_BG       = colors.HexColor('#f4f5f5')
SECTION_BG    = colors.HexColor('#f0f1f2')
CARD_BG       = colors.HexColor('#e8eaeb')
TABLE_STRIPE  = colors.HexColor('#ebeded')
HEADER_FILL   = colors.HexColor('#32454e')
COVER_BLOCK   = colors.HexColor('#566a74')
BORDER        = colors.HexColor('#acbdc5')
ICON          = colors.HexColor('#4b86a4')
ACCENT        = colors.HexColor('#1f6c92')
ACCENT_2      = colors.HexColor('#c23a50')
TEXT_PRIMARY   = colors.HexColor('#131515')
TEXT_MUTED     = colors.HexColor('#747b7e')
SEM_SUCCESS   = colors.HexColor('#529067')
SEM_WARNING   = colors.HexColor('#8c7443')
SEM_ERROR     = colors.HexColor('#a25b54')
SEM_INFO      = colors.HexColor('#507aa4')

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FONT REGISTRATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
pdfmetrics.registerFont(TTFont('FreeSerif', os.path.join(FONT_DIR, 'freefont/FreeSerif.ttf')))
pdfmetrics.registerFont(TTFont('FreeSerif-Bold', os.path.join(FONT_DIR, 'freefont/FreeSerifBold.ttf')))
pdfmetrics.registerFont(TTFont('FreeSerif-Italic', os.path.join(FONT_DIR, 'freefont/FreeSerifItalic.ttf')))
pdfmetrics.registerFont(TTFont('FreeSerif-BoldItalic', os.path.join(FONT_DIR, 'freefont/FreeSerifBoldItalic.ttf')))
registerFontFamily('FreeSerif', normal='FreeSerif', bold='FreeSerif-Bold',
                    italic='FreeSerif-Italic', boldItalic='FreeSerif-BoldItalic')

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PAGE DIMENSIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAGE_W, PAGE_H = A4  # 595.28 x 841.89
LEFT_M = 1.0 * inch
RIGHT_M = 1.0 * inch
TOP_M = 0.85 * inch
BOTTOM_M = 0.85 * inch
AVAIL_W = PAGE_W - LEFT_M - RIGHT_M  # ~451pt
AVAIL_H = PAGE_H - TOP_M - BOTTOM_M

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STYLES
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
styles = getSampleStyleSheet()

s_h1 = ParagraphStyle(
    name='H1', fontName='FreeSerif-Bold', fontSize=20, leading=26,
    textColor=TEXT_PRIMARY, spaceBefore=18, spaceAfter=10,
    alignment=TA_LEFT
)
s_h2 = ParagraphStyle(
    name='H2', fontName='FreeSerif-Bold', fontSize=14, leading=19,
    textColor=HEADER_FILL, spaceBefore=14, spaceAfter=6,
    alignment=TA_LEFT
)
s_h3 = ParagraphStyle(
    name='H3', fontName='FreeSerif-Bold', fontSize=11.5, leading=16,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=4,
    alignment=TA_LEFT
)
s_body = ParagraphStyle(
    name='Body', fontName='FreeSerif', fontSize=10.5, leading=17,
    textColor=TEXT_PRIMARY, spaceBefore=3, spaceAfter=6,
    alignment=TA_JUSTIFY
)
s_body_indent = ParagraphStyle(
    name='BodyIndent', parent=s_body, leftIndent=18
)

s_bullet = ParagraphStyle(
    name='Bullet', fontName='FreeSerif', fontSize=10.5, leading=17,
    textColor=TEXT_PRIMARY, leftIndent=24, bulletIndent=12,
    spaceBefore=2, spaceAfter=2, alignment=TA_LEFT
)

s_toc_h0 = ParagraphStyle(
    name='TOCH0', fontName='FreeSerif-Bold', fontSize=13, leading=22,
    leftIndent=20, textColor=TEXT_PRIMARY
)
s_toc_h1 = ParagraphStyle(
    name='TOCH1', fontName='FreeSerif', fontSize=11, leading=18,
    leftIndent=40, textColor=TEXT_MUTED
)

s_table_header = ParagraphStyle(
    name='TH', fontName='FreeSerif-Bold', fontSize=10, leading=14,
    textColor=colors.white, alignment=TA_CENTER
)
s_table_cell = ParagraphStyle(
    name='TC', fontName='FreeSerif', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT
)
s_table_cell_c = ParagraphStyle(
    name='TCC', fontName='FreeSerif', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER
)

s_caption = ParagraphStyle(
    name='Caption', fontName='FreeSerif-Italic', fontSize=8.5, leading=12,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=4, spaceAfter=8
)

s_callout_num = ParagraphStyle(
    name='CalloutNum', fontName='FreeSerif-Bold', fontSize=22, leading=26,
    textColor=ACCENT, alignment=TA_CENTER
)
s_callout_label = ParagraphStyle(
    name='CalloutLabel', fontName='FreeSerif', fontSize=9, leading=12,
    textColor=TEXT_MUTED, alignment=TA_CENTER
)

s_quote = ParagraphStyle(
    name='Quote', fontName='FreeSerif-Italic', fontSize=11, leading=17,
    textColor=TEXT_MUTED, leftIndent=24, borderLeftWidth=2,
    borderLeftColor=ACCENT, borderPadding=8, spaceBefore=8, spaceAfter=8
)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# TOC TEMPLATE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))


def add_heading(text, style, level=0):
    key = 'h_%s' % hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph('<a name="%s"/>%s' % (key, text), style)
    p.bookmark_name = text
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    return p


def make_table(header_row, data_rows, col_ratios=None):
    """Create a styled table with palette colors."""
    if col_ratios:
        cw = [r * AVAIL_W for r in col_ratios]
    else:
        n = len(header_row)
        cw = [AVAIL_W / n] * n
    
    all_data = [header_row] + data_rows
    t = Table(all_data, colWidths=cw, hAlign='CENTER')
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.5, BORDER),
        ('BOX', (0, 0), (-1, -1), 1, HEADER_FILL),
    ]
    for i in range(1, len(all_data)):
        bg = colors.white if i % 2 == 1 else TABLE_STRIPE
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    return t


def callout_box(number, label):
    """Stat callout box."""
    t = Table(
        [[Paragraph('<b>%s</b>' % number, s_callout_num)],
         [Paragraph(label, s_callout_label)]],
        colWidths=[130], hAlign='CENTER'
    )
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), CARD_BG),
        ('BOX', (0, 0), (-1, -1), 1.5, ACCENT),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    return t


def divider():
    return HRFlowable(width='100%', thickness=0.75, color=BORDER, spaceBefore=6, spaceAfter=6)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# HEADER / FOOTER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def header_footer(canvas, doc):
    canvas.saveState()
    # Header
    canvas.setFont('FreeSerif', 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LEFT_M, PAGE_H - 0.55 * inch, 'GHMS - Guest House Management System | Technical Proposal')
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(1.2)
    canvas.line(LEFT_M, PAGE_H - 0.62 * inch, PAGE_W - RIGHT_M, PAGE_H - 0.62 * inch)
    # Footer
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(LEFT_M, 0.6 * inch, PAGE_W - RIGHT_M, 0.6 * inch)
    canvas.setFont('FreeSerif', 7.5)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LEFT_M, 0.42 * inch, 'Confidential')
    canvas.drawRightString(PAGE_W - RIGHT_M, 0.42 * inch, 'Page %d' % doc.page)
    canvas.restoreState()


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BUILD STORY
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
story = []

# ---------- TABLE OF CONTENTS ----------
toc = TableOfContents()
toc.levelStyles = [s_toc_h0, s_toc_h1]
story.append(Paragraph('<b>Table of Contents</b>', s_h1))
story.append(Spacer(1, 8))
story.append(toc)
story.append(PageBreak())

# ========================================================
# CHAPTER NUMBERING PLAN
# ========================================================
# | Outline Index | Type    | Chapter # | Title                    |
# |---------------|---------|-----------|--------------------------|
# | 1             | cover   | --        | Cover Page               |
# | 2             | toc     | --        | Table of Contents        |
# | 3             | content | 1         | Executive Summary        |
# | 4             | content | 2         | The Problem              |
# | 5             | content | 3         | Proposed Solution        |
# | 6             | content | 4         | Module Details           |
# | 7             | content | 5         | Implementation Timeline   |
# | 8             | content | 6         | Cost Estimate            |
# | 9             | content | 7         | Benefits & ROI           |
# | 10            | content | 8         | Technology Stack         |
# | 11            | content | 9         | Why Choose Us            |
# | 12            | content | 10        | Next Steps               |
# ========================================================

# ========================================================
# CHAPTER 1: EXECUTIVE SUMMARY
# ========================================================
story.append(CondPageBreak(AVAIL_H * 0.25))
story.append(add_heading('1. Executive Summary', s_h1, level=0))
story.append(divider())

story.append(Paragraph(
    'The hospitality sector in Ethiopia is experiencing rapid growth, driven by expanding '
    'domestic travel, rising foreign investment, and government initiatives to promote tourism '
    'as a cornerstone of economic development. Despite this growth, the guest house industry '
    'remains overwhelmingly dependent on manual, paper-based processes for managing reservations, '
    'guest registrations, financial records, and regulatory compliance. This creates significant '
    'operational inefficiencies, revenue leakage, and critical gaps in public safety oversight.',
    s_body
))
story.append(Paragraph(
    'We propose the <b>Guest House Management System (GHMS)</b> — a comprehensive, cloud-hosted '
    'SaaS platform designed specifically for the Ethiopian market. The system digitizes the entire '
    'lifecycle of guest house operations, from room inventory management and reservation booking '
    'to expense tracking, financial reporting, and subscription-based billing. Critically, GHMS '
    'includes a fully integrated <b>Law Enforcement and Security Module</b> that provides police '
    'authorities with real-time cross-establishment visibility into guest movements, automated '
    'suspect matching, and a sophisticated seven-type anomaly detection engine — all without '
    'compromising the privacy or operational independence of individual guest house operators.',
    s_body
))
story.append(Paragraph(
    'The platform is built on a modern, scalable technology stack (Next.js, PostgreSQL, Prisma ORM) '
    'and supports a multi-tenant architecture where each guest house operates in its own secure, '
    'isolated data environment. The system is designed for rapid deployment, intuitive adoption by '
    'users with varying levels of technical proficiency, and long-term extensibility as regulatory '
    'requirements and business needs evolve. This proposal outlines the problem landscape, our '
    'proposed solution, implementation timeline, cost structure, and the tangible benefits that '
    'stakeholders can expect upon deployment.',
    s_body
))

# Key stats callouts
stats_row = Table(
    [[
        callout_box('5', 'Core Modules'),
        callout_box('50+', 'API Endpoints'),
        callout_box('7', 'Anomaly Types'),
    ]],
    colWidths=[AVAIL_W / 3] * 3, hAlign='CENTER'
)
stats_row.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('LEFTPADDING', (0, 0), (-1, -1), 4),
    ('RIGHTPADDING', (0, 0), (-1, -1), 4),
]))
story.append(Spacer(1, 8))
story.append(stats_row)
story.append(Spacer(1, 6))
story.append(Paragraph('Figure 1: GHMS Platform at a Glance', s_caption))


# ========================================================
# CHAPTER 2: THE PROBLEM
# ========================================================
story.append(CondPageBreak(AVAIL_H * 0.25))
story.append(add_heading('2. The Problem', s_h1, level=0))
story.append(divider())

story.append(Paragraph(
    'Through extensive consultation with guest house operators, law enforcement officials, and '
    'local government administrators, we have identified a set of deeply interconnected problems '
    'that collectively undermine the efficiency, profitability, and safety of the guest house '
    'sector. These challenges are not isolated to any single establishment; they are systemic '
    'issues that affect the entire industry ecosystem, from small family-run guest houses to '
    'larger commercial operations.',
    s_body
))

# 2.1
story.append(add_heading('2.1 Manual and Paper-Based Operations', s_h2, level=1))
story.append(Paragraph(
    'The vast majority of guest houses in Ethiopia still rely on handwritten registration books, '
    'physical filing systems, and verbal communication for managing their daily operations. Room '
    'availability is tracked on whiteboards or in notebooks, reservations are recorded in paper '
    'ledgers, and guest check-in/check-out processes involve manually copying identification details '
    'into binders. This approach is inherently error-prone: pages can be misplaced, handwriting can '
    'be illegible, and there is no way to quickly search for a specific guest, reservation, or '
    'transaction without physically flipping through hundreds of pages.',
    s_body
))
story.append(Paragraph(
    'The consequences extend beyond mere inconvenience. Double-bookings are common when multiple '
    'staff members cannot see real-time room availability, leading to guest dissatisfaction and '
    'lost revenue. Financial records are scattered across different notebooks and spreadsheets, '
    'making it virtually impossible to generate accurate profit-and-loss statements or identify '
    'cost-saving opportunities. Regulatory reporting — such as submitting guest registration data '
    'to local authorities — requires manually transcribing information from paper records, a '
    'process that is both time-consuming and susceptible to transcription errors. For operators '
    'managing more than a handful of rooms, the administrative burden becomes a significant '
    'barrier to growth.',
    s_body
))

# 2.2
story.append(add_heading('2.2 Revenue Leakage and Financial Opacity', s_h2, level=1))
story.append(Paragraph(
    'Without a centralized digital system, guest house operators lack real-time visibility into '
    'their financial performance. Cash transactions go unrecorded, expenses are tracked inconsistently, '
    'and there is no automated mechanism to reconcile payments against reservations. This results in '
    'significant revenue leakage: studies in similar emerging markets suggest that small hospitality '
    'businesses lose between 8% and 15% of potential revenue annually due to poor financial tracking '
    'and unrecorded transactions.',
    s_body
))
story.append(Paragraph(
    'Furthermore, the inability to generate timely financial reports means that operators cannot '
    'make data-driven decisions about pricing, staffing, or investment. They cannot identify which '
    'room types are most profitable, which expense categories are consuming the largest share of '
    'revenue, or whether their occupancy rates are improving or declining over time. This financial '
    'opacity also creates challenges for tax compliance and for securing financing from banks or '
    'investors who require auditable financial records.',
    s_body
))

# 2.3
story.append(add_heading('2.3 Public Safety and Regulatory Gaps', s_h2, level=1))
story.append(Paragraph(
    'Perhaps the most critical challenge is the near-total absence of digital integration between '
    'guest house operations and law enforcement agencies. When a guest checks into a guest house, '
    'their identification details are recorded on paper and filed away. There is no mechanism to '
    'cross-reference this information against police watchlists, no automated alert when a person '
    'of interest registers at multiple establishments within a short period, and no centralized '
    'database that investigators can query when conducting criminal investigations.',
    s_body
))
story.append(Paragraph(
    'This gap has real public safety implications. In many jurisdictions, guest houses have been '
    'exploited as temporary bases for illicit activities precisely because there is no digital '
    'trail connecting guest movements across different establishments. Law enforcement officers '
    'must physically visit each guest house, request paper records, and manually cross-reference '
    'names and identification numbers — a process that can take days or weeks for a single '
    'investigation. The absence of automated anomaly detection means that suspicious patterns — '
    'such as the same person using different names at different guest houses, or unusually large '
    'cash payments for short stays — go entirely unnoticed until a crime is reported.',
    s_body
))

# 2.4
story.append(add_heading('2.4 Fragmented Technology Landscape', s_h2, level=1))
story.append(Paragraph(
    'Existing software solutions in the market are either designed for large hotels and are too '
    'complex and expensive for small guest houses, or they are basic booking tools that lack the '
    'financial management, regulatory compliance, and law enforcement integration features that '
    'the Ethiopian context demands. Many guest house operators have attempted to adopt generic '
    'spreadsheet-based solutions, but these quickly become unwieldy as the volume of reservations '
    'and guest data grows. There is no purpose-built, affordable, locally-adapted platform that '
    'addresses the full spectrum of guest house management needs while also serving the public '
    'safety requirements of government authorities.',
    s_body
))


# ========================================================
# CHAPTER 3: PROPOSED SOLUTION
# ========================================================
story.append(CondPageBreak(AVAIL_H * 0.25))
story.append(add_heading('3. Proposed Solution', s_h1, level=0))
story.append(divider())

story.append(Paragraph(
    'GHMS is a fully integrated, web-based SaaS platform that addresses every challenge '
    'identified above through a cohesive, modular architecture. The system is accessible from '
    'any device with a web browser, eliminating the need for expensive hardware installations '
    'or specialized software licenses. It follows a multi-tenant design where each guest house '
    'operates within its own securely isolated data environment, while authorized law enforcement '
    'personnel can access aggregated, cross-establishment data for public safety purposes.',
    s_body
))

story.append(Paragraph(
    'The platform is organized into five core modules, each targeting a specific operational '
    'domain. These modules function independently — allowing phased deployment — while '
    'seamlessly sharing data to create a unified operational ecosystem. The following table '
    'provides an overview of each module, its primary function, key users, and deployment priority.',
    s_body
))

module_overview = make_table(
    [Paragraph('<b>Module</b>', s_table_header),
     Paragraph('<b>Primary Function</b>', s_table_header),
     Paragraph('<b>Key Users</b>', s_table_header),
     Paragraph('<b>Priority</b>', s_table_header)],
    [
        [Paragraph('Guest House Operations', s_table_cell),
         Paragraph('Room management, reservations, guest registration with Ethiopian administrative hierarchy, daytime service bookings', s_table_cell),
         Paragraph('Operators, Front Desk Staff', s_table_cell_c),
         Paragraph('Phase 1', s_table_cell_c)],
        [Paragraph('Financial Management', s_table_cell),
         Paragraph('Expense tracking, payment ledger, automated financial reports, profit/loss analytics, revenue dashboards', s_table_cell),
         Paragraph('Operators, Accountants, Management', s_table_cell_c),
         Paragraph('Phase 1', s_table_cell_c)],
        [Paragraph('Operations and Resources', s_table_cell),
         Paragraph('Housekeeping task scheduling, inventory management, guest reviews, in-app notifications', s_table_cell),
         Paragraph('Operators, Housekeeping Staff', s_table_cell_c),
         Paragraph('Phase 2', s_table_cell_c)],
        [Paragraph('Law Enforcement and Security', s_table_cell),
         Paragraph('Cross-provider guest search, suspect watchlist matching, 7-type anomaly detection, geofencing, intelligence analytics', s_table_cell),
         Paragraph('Police Officers, Investigators, Command Staff', s_table_cell_c),
         Paragraph('Phase 2', s_table_cell_c)],
        [Paragraph('Platform Administration', s_table_cell),
         Paragraph('Multi-tenant provider management, subscription billing, user access control, audit logging, joint operations', s_table_cell),
         Paragraph('System Administrators, Government Supervisors', s_table_cell_c),
         Paragraph('Phase 3', s_table_cell_c)],
    ],
    col_ratios=[0.18, 0.38, 0.24, 0.10]
)
story.append(Spacer(1, 6))
story.append(module_overview)
story.append(Paragraph('Table 1: GHMS Module Overview', s_caption))

# 3.1 Core Design Principles
story.append(add_heading('3.1 Core Design Principles', s_h2, level=1))
story.append(Paragraph(
    'Every architectural and design decision in GHMS is guided by four foundational principles '
    'that ensure the platform meets the needs of all stakeholders — from individual guest house '
    'operators to government regulators and law enforcement agencies.',
    s_body
))
story.append(Paragraph(
    '<b>Security and Data Isolation:</b> Each guest house operates within a strictly isolated data '
    'environment enforced by provider-level foreign keys throughout the database schema. Police '
    'users receive read-only cross-provider access through a separate authentication context. '
    'All authentication uses JWT tokens stored in httpOnly cookies, passwords are hashed with '
    'bcrypt, and every police data access is logged in a comprehensive audit trail. A unique '
    'dual-authorization "Joint Session" mechanism requires simultaneous authentication by both '
    'a system administrator and a police administrator for emergency actions such as mass '
    'suspension of all guest houses.',
    s_body
))
story.append(Paragraph(
    '<b>Simplicity and Usability:</b> The interface is built with shadcn/ui component library and '
    'Tailwind CSS, providing a clean, modern design that requires minimal training. Role-based '
    'navigation ensures that each user sees only the features relevant to their role. The entire '
    'application is fully responsive, adapting seamlessly from desktop monitors to mobile phones, '
    'which is critical for front desk staff who may need to check in guests using a tablet.',
    s_body
))
story.append(Paragraph(
    '<b>Multi-Tenant Scalability:</b> The architecture supports an unlimited number of guest houses '
    'on a single platform instance, with no performance degradation as the tenant count grows. '
    'Subscription management with automated billing cycles, 15-day free trials, 7-day expiry '
    'warnings, and grace periods allows operators to adopt the system with minimal upfront '
    'commitment while providing the platform operator with predictable recurring revenue.',
    s_body
))
story.append(Paragraph(
    '<b>Localization and Compliance:</b> The system is purpose-built for the Ethiopian market, '
    'with full support for Ethiopian administrative divisions (Region, Zone/Sub-city, Woreda, '
    'Kebele) in guest registration, Amharic-localized expense categories, ETB currency formatting, '
    'and localized tax calculations. This ensures immediate usability without the adaptation '
    'overhead that generic international platforms require.',
    s_body
))


# ========================================================
# CHAPTER 4: MODULE DETAILS
# ========================================================
story.append(CondPageBreak(AVAIL_H * 0.25))
story.append(add_heading('4. Module Details', s_h1, level=0))
story.append(divider())

# 4.1
story.append(add_heading('4.1 Module 1: Guest House Operations', s_h2, level=1))
story.append(Paragraph(
    'This module forms the operational backbone of the system, digitizing every aspect of '
    'guest house room and reservation management. It replaces paper-based room availability '
    'boards with a real-time digital room inventory that supports five room types (Single, Double, '
    'Twin, Suite, Deluxe) with configurable pricing, floor assignments, capacity limits, and '
    'amenity tracking. Each room can have its status updated instantly — Available, Occupied, '
    'Maintenance, or Reserved — providing all staff members with an accurate, up-to-the-minute '
    'view of inventory.',
    s_body
))
story.append(Paragraph(
    'The reservation management subsystem handles the complete booking lifecycle from creation '
    'through check-in, check-out, and cancellation. Reservations automatically calculate the '
    'number of nights, room rate, applicable taxes, and any discounts, producing a transparent '
    'cost breakdown for both the operator and the guest. The system tracks payment status, '
    'payment method (cash, mobile banking, bank transfer), and outstanding balances, ensuring '
    'that no revenue falls through the cracks. Guest registration captures comprehensive '
    'identification data including full Ethiopian address hierarchy, vehicle plate numbers, and '
    'VIP status flags, creating a rich data foundation for both operational and security purposes.',
    s_body
))
story.append(Paragraph(
    'Additionally, the module includes a daytime service booking system that allows guest houses '
    'to offer and manage ancillary services such as conference room rentals, laundry, meals, or '
    'transportation. This extends the revenue model beyond overnight stays and provides guests '
    'with a seamless, integrated service experience.',
    s_body
))

feat_ops = make_table(
    [Paragraph('<b>Feature</b>', s_table_header),
     Paragraph('<b>Description</b>', s_table_header)],
    [
        [Paragraph('Room Inventory', s_table_cell),
         Paragraph('5 room types, real-time status tracking, amenity management, floor and capacity configuration', s_table_cell)],
        [Paragraph('Reservation Lifecycle', s_table_cell),
         Paragraph('Create, check-in, check-out, cancel with automatic night/rate/tax calculations and balance tracking', s_table_cell)],
        [Paragraph('Guest Registration', s_table_cell),
         Paragraph('Full Ethiopian administrative address hierarchy, ID tracking, vehicle plate, VIP flags, nationality', s_table_cell)],
        [Paragraph('Daytime Services', s_table_cell),
         Paragraph('Catalog management, booking, pricing per service, payment tracking for non-overnight revenue', s_table_cell)],
        [Paragraph('Dashboard', s_table_cell),
         Paragraph('Real-time KPIs: occupancy rate, active reservations, today arrivals/departures, monthly revenue, alerts', s_table_cell)],
    ],
    col_ratios=[0.25, 0.65]
)
story.append(Spacer(1, 6))
story.append(feat_ops)
story.append(Paragraph('Table 2: Guest House Operations Feature Summary', s_caption))

# 4.2
story.append(add_heading('4.2 Module 2: Financial Management and Reporting', s_h2, level=1))
story.append(Paragraph(
    'The Financial Management module transforms how guest house operators understand and control '
    'their revenue streams. At its core is a comprehensive expense tracking system that records '
    'every operational expense with date, category, description, amount, vendor, payment method, '
    'receipt number, and tax amount. Expense categories are pre-populated with common hospitality '
    'costs (utilities, supplies, salaries, maintenance, food and beverage) and include Amharic '
    'localizations for staff who prefer to work in the national language.',
    s_body
))
story.append(Paragraph(
    'The reporting engine generates detailed financial reports on demand, including total revenue, '
    'total expenses, net profit, and occupancy rate analytics. Reports can be filtered by any '
    'date range, enabling operators to compare performance across weeks, months, or seasons. '
    'Visual charts show revenue trends over time and expense breakdowns by category, making it '
    'immediately clear where money is being spent and which revenue streams are performing best. '
    'All reports support export to spreadsheet format for further analysis or archival.',
    s_body
))
story.append(Paragraph(
    'The payment ledger provides a unified record of all financial transactions, linked to either '
    'reservations or daytime service bookings, creating a complete audit trail. Combined with the '
    'subscription billing system at the platform level, this module ensures that every birr '
    'flowing through the system is tracked, categorized, and reportable.',
    s_body
))

# 4.3
story.append(add_heading('4.3 Module 3: Operations and Resource Management', s_h2, level=1))
story.append(Paragraph(
    'This module covers the operational logistics that keep a guest house running smoothly. The '
    'housekeeping subsystem allows staff to create, assign, and track cleaning and maintenance '
    'tasks for each room. Tasks can be scheduled by date, assigned to specific staff members, and '
    'tracked through completion with timestamps. Status filters (Pending, In Progress, Completed) '
    'give supervisors an instant view of housekeeping operations across the entire property, enabling '
    'them to prioritize rooms that need attention before the next guest arrival.',
    s_body
))
story.append(Paragraph(
    'The inventory management subsystem tracks supplies and resources (cleaning products, linens, '
    'toiletries, food and beverage items) with quantity, unit, minimum reorder levels, cost per '
    'unit, and supplier information. When stock falls below the configured minimum level, the '
    'system flags the item for restocking, preventing shortages that could disrupt operations. '
    'A guest review and rating system captures feedback after each stay, providing operators with '
    'valuable insights into service quality and guest satisfaction. An integrated notification '
    'system delivers in-app alerts for important events such as approaching check-outs, '
    'subscription expiry warnings, and system announcements.',
    s_body
))

# 4.4
story.append(add_heading('4.4 Module 4: Law Enforcement and Security', s_h2, level=1))
story.append(Paragraph(
    'This module is what truly distinguishes GHMS from conventional hotel management software. '
    'It provides law enforcement agencies with a powerful, legally scoped set of tools for '
    'monitoring guest movements across all registered guest houses, without requiring direct '
    'access to any individual establishment’s operational data. The module is accessed through '
    'a separate police portal with its own role-based hierarchy (Viewer, Officer, Detective, '
    'Admin), ensuring that sensitive capabilities are restricted to appropriately authorized personnel.',
    s_body
))

story.append(add_heading('4.4.1 Suspect Matching System', s_h3, level=1))
story.append(Paragraph(
    'Every guest registration, reservation creation, and daytime booking automatically triggers a '
    'background check against the police-maintained suspected persons watchlist. The system matches '
    'by name (including intelligent last-name extraction), phone number (substring matching), and '
    'ID number (exact match). When a match is found, a detailed alert is created containing the '
    'guest’s details, the matching suspect’s profile, the provider information, and the '
    'match type. This fire-and-forget design means the check never slows down the normal '
    'booking process, and all matches are logged for investigative reference.',
    s_body
))

story.append(add_heading('4.4.2 Smart Anomaly Detection Engine', s_h3, level=1))
story.append(Paragraph(
    'The centerpiece of the security module is a rule-based anomaly detection engine that '
    'automatically identifies seven distinct types of suspicious behavior patterns. Unlike simple '
    'threshold alerts, this engine uses configurable risk scores (0-100) and severity levels '
    '(Low, Medium, High, Critical) to prioritize alerts for investigators. The seven anomaly types are:',
    s_body
))

anomaly_table = make_table(
    [Paragraph('<b>Anomaly Type</b>', s_table_header),
     Paragraph('<b>Detection Logic</b>', s_table_header),
     Paragraph('<b>Risk Score</b>', s_table_header)],
    [
        [Paragraph('Identity Mismatch', s_table_cell),
         Paragraph('Same phone number with different names or ID numbers across providers', s_table_cell),
         Paragraph('30+', s_table_cell_c)],
        [Paragraph('Rapid Multi-Provider', s_table_cell),
         Paragraph('Bookings at 2 or more providers within 48 hours', s_table_cell),
         Paragraph('35+', s_table_cell_c)],
        [Paragraph('No-Show Pattern', s_table_cell),
         Paragraph('3 or more cancelled or unfulfilled reservations', s_table_cell),
         Paragraph('15+', s_table_cell_c)],
        [Paragraph('Cash Anomaly', s_table_cell),
         Paragraph('Unusually large cash payments exceeding 5,000 ETB or 3x average', s_table_cell),
         Paragraph('25+', s_table_cell_c)],
        [Paragraph('Cross-Provider ID', s_table_cell),
         Paragraph('Same ID number with different names at different providers', s_table_cell),
         Paragraph('40+', s_table_cell_c)],
        [Paragraph('Short-Stay Pattern', s_table_cell),
         Paragraph('3 or more one-night stays at 2+ providers within 30 days', s_table_cell),
         Paragraph('25+', s_table_cell_c)],
        [Paragraph('Fake ID Pattern', s_table_cell),
         Paragraph('Multiple guests sharing the same identification number', s_table_cell),
         Paragraph('45+', s_table_cell_c)],
    ],
    col_ratios=[0.22, 0.58, 0.12]
)
story.append(Spacer(1, 6))
story.append(anomaly_table)
story.append(Paragraph('Table 3: Anomaly Detection Types and Risk Scoring', s_caption))

story.append(Paragraph(
    'The engine includes built-in duplicate prevention with configurable deduplication windows '
    '(24-168 hours) to avoid alert fatigue. A system-wide scan capability allows administrators '
    'to run batch analysis across all historical records, processing data in optimized batches '
    'of 20 records at a time. High and Critical severity anomalies automatically generate '
    'in-app notifications to ensure immediate awareness.',
    s_body
))

story.append(add_heading('4.4.3 Intelligence and Investigation Tools', s_h3, level=1))
story.append(Paragraph(
    'Beyond automated detection, the module provides investigators with manual intelligence-gathering '
    'tools. Cross-provider guest linking reveals when the same individual has stayed at multiple '
    'establishments, with frequency analysis and average days between stays. Geofencing allows '
    'police to define geographic alert zones with configurable radius and severity levels, '
    'triggering alerts when registered guests are associated with locations of interest. A '
    'streaming data export system enables investigators to download large datasets (up to 10,000 '
    'records) in JSON or CSV format using memory-efficient cursor-based pagination, supporting '
    'complex analytical work without impacting system performance.',
    s_body
))

# 4.5
story.append(add_heading('4.5 Module 5: Platform Administration', s_h2, level=1))
story.append(Paragraph(
    'The Platform Administration module provides the centralized control plane for the entire GHMS '
    'ecosystem. System administrators (Superusers) can manage all registered guest house providers, '
    'review and approve or reject registration applications, and monitor the health of the platform '
    'through a comprehensive dashboard showing total providers, active users, and system-wide metrics. '
    'The subscription management subsystem supports four billing cycles (Monthly, Quarterly, Semi-Annual, '
    'Yearly) with automatic lifecycle management: 15-day free trials on approval, 7-day expiry '
    'warnings, 2-day grace periods, and automatic service suspension after the grace period expires.',
    s_body
))
story.append(Paragraph(
    'Complete audit logging tracks every police data access event, recording the officer’s name, '
    'the action performed, the target data, and the originating IP address. This creates an '
    'unbroken chain of accountability that satisfies legal and regulatory requirements for '
    'oversight of law enforcement access to private business data. The joint operations feature — '
    'a unique dual-authorization mechanism — enables emergency actions that require concurrent '
    'approval from both a system administrator and a police administrator, adding a critical layer '
    'of procedural safeguard to high-impact decisions.',
    s_body
))


# ========================================================
# CHAPTER 5: IMPLEMENTATION TIMELINE
# ========================================================
story.append(CondPageBreak(AVAIL_H * 0.25))
story.append(add_heading('5. Implementation Timeline', s_h1, level=0))
story.append(divider())

story.append(Paragraph(
    'The implementation follows a phased approach designed to deliver tangible value early, '
    'minimize disruption to daily operations, and allow for iterative feedback at each stage. '
    'The total project duration is approximately 14 weeks from agreement signing to full system '
    'handover, assuming timely feedback and cooperation from all stakeholders. Each phase includes '
    'dedicated time for development, testing, user training, and feedback incorporation.',
    s_body
))

timeline_table = make_table(
    [Paragraph('<b>Phase</b>', s_table_header),
     Paragraph('<b>Module</b>', s_table_header),
     Paragraph('<b>Duration</b>', s_table_header),
     Paragraph('<b>Key Deliverables</b>', s_table_header)],
    [
        [Paragraph('Phase 1', s_table_cell_c),
         Paragraph('Guest House Operations and Financial Management', s_table_cell),
         Paragraph('5 weeks', s_table_cell_c),
         Paragraph('Room management, reservations, guest registration, expense tracking, financial reports, operator dashboard, user training materials', s_table_cell)],
        [Paragraph('Phase 2', s_table_cell_c),
         Paragraph('Operations, Resources, and Law Enforcement Security', s_table_cell),
         Paragraph('5 weeks', s_table_cell_c),
         Paragraph('Housekeeping, inventory, notifications, police portal, suspect matching, anomaly detection engine, intelligence tools, data export', s_table_cell)],
        [Paragraph('Phase 3', s_table_cell_c),
         Paragraph('Platform Administration and Multi-Tenancy', s_table_cell),
         Paragraph('2 weeks', s_table_cell_c),
         Paragraph('Provider management, subscription billing, audit logging, joint operations, superuser dashboard', s_table_cell)],
        [Paragraph('Phase 4', s_table_cell_c),
         Paragraph('Testing, Training, and Go-Live', s_table_cell),
         Paragraph('2 weeks', s_table_cell_c),
         Paragraph('End-to-end testing, security audit, staff training sessions, user manuals, data migration support, production deployment', s_table_cell)],
    ],
    col_ratios=[0.10, 0.24, 0.10, 0.46]
)
story.append(Spacer(1, 6))
story.append(timeline_table)
story.append(Paragraph('Table 4: Implementation Timeline and Deliverables', s_caption))

story.append(Paragraph(
    'Each phase begins with a detailed requirements confirmation meeting to ensure alignment '
    'between the development team and stakeholders. At the end of each phase, a formal review '
    'session is conducted to demonstrate completed functionality, gather feedback, and incorporate '
    'any necessary adjustments before proceeding. This iterative approach ensures that the final '
    'system accurately reflects real operational needs rather than imposing a rigid, one-size-fits-all '
    'solution. Data migration support is provided during Phase 1, with structured templates and '
    'guidance for transferring existing paper or spreadsheet records into the digital system.',
    s_body
))

# Milestones
story.append(add_heading('5.1 Key Milestones', s_h2, level=1))
milestone_table = make_table(
    [Paragraph('<b>Milestone</b>', s_table_header),
     Paragraph('<b>Target</b>', s_table_header),
     Paragraph('<b>Success Criteria</b>', s_table_header)],
    [
        [Paragraph('M1: Core Operations Live', s_table_cell),
         Paragraph('Week 5', s_table_cell_c),
         Paragraph('Operators can manage rooms, book reservations, register guests, and view financial reports', s_table_cell)],
        [Paragraph('M2: Security Module Deployed', s_table_cell),
         Paragraph('Week 10', s_table_cell_c),
         Paragraph('Police portal operational with suspect matching, anomaly detection, and cross-provider search', s_table_cell)],
        [Paragraph('M3: Platform Admin Active', s_table_cell),
         Paragraph('Week 12', s_table_cell_c),
         Paragraph('Subscription management, provider approvals, and audit logging fully functional', s_table_cell)],
        [Paragraph('M4: Production Go-Live', s_table_cell),
         Paragraph('Week 14', s_table_cell_c),
         Paragraph('All modules tested, staff trained, data migrated, system in production with support', s_table_cell)],
    ],
    col_ratios=[0.25, 0.12, 0.53]
)
story.append(Spacer(1, 4))
story.append(milestone_table)
story.append(Paragraph('Table 5: Key Milestones', s_caption))


# ========================================================
# CHAPTER 6: COST ESTIMATE
# ========================================================
story.append(CondPageBreak(AVAIL_H * 0.25))
story.append(add_heading('6. Cost Estimate', s_h1, level=0))
story.append(divider())

story.append(Paragraph(
    'We understand that government and institutional budgets require transparent, justifiable, '
    'and phased expenditure structures. Our pricing is designed to be predictable, aligned with '
    'the phased delivery approach, and inclusive of all necessary components — there are no hidden '
    'fees or unexpected charges. The total investment covers all five modules, including development, '
    'deployment, training, documentation, and 12 months of post-launch technical support. Recurring '
    'costs are limited to infrastructure hosting, which is modest given the cloud-native architecture.',
    s_body
))

cost_table = make_table(
    [Paragraph('<b>Component</b>', s_table_header),
     Paragraph('<b>Scope</b>', s_table_header),
     Paragraph('<b>Cost (ETB)</b>', s_table_header)],
    [
        [Paragraph('Module 1: Guest House Operations', s_table_cell),
         Paragraph('Room management, reservations, guest registration, daytime services, dashboard', s_table_cell),
         Paragraph('Negotiable', s_table_cell_c)],
        [Paragraph('Module 2: Financial Management', s_table_cell),
         Paragraph('Expense tracking, payment ledger, automated reports, revenue analytics', s_table_cell),
         Paragraph('Negotiable', s_table_cell_c)],
        [Paragraph('Module 3: Operations and Resources', s_table_cell),
         Paragraph('Housekeeping, inventory, reviews, notifications, user management', s_table_cell),
         Paragraph('Negotiable', s_table_cell_c)],
        [Paragraph('Module 4: Law Enforcement and Security', s_table_cell),
         Paragraph('Police portal, suspect matching, 7-type anomaly detection, geofencing, intelligence tools, data export', s_table_cell),
         Paragraph('Negotiable', s_table_cell_c)],
        [Paragraph('Module 5: Platform Administration', s_table_cell),
         Paragraph('Provider management, subscription billing, audit logging, joint operations, superuser tools', s_table_cell),
         Paragraph('Negotiable', s_table_cell_c)],
        [Paragraph('Training and Documentation', s_table_cell),
         Paragraph('On-site training sessions, user manuals, quick-reference guides, video tutorials', s_table_cell),
         Paragraph('Included', s_table_cell_c)],
        [Paragraph('12-Month Post-Launch Support', s_table_cell),
         Paragraph('Bug fixes, security patches, minor enhancements, technical assistance', s_table_cell),
         Paragraph('Included', s_table_cell_c)],
    ],
    col_ratios=[0.28, 0.50, 0.14]
)
story.append(Spacer(1, 6))
story.append(cost_table)
story.append(Paragraph('Table 6: Cost Breakdown by Module', s_caption))

# Payment terms
story.append(add_heading('6.1 Payment Schedule', s_h2, level=1))
story.append(Paragraph(
    'Payments are structured to align with project milestones, reducing financial risk and '
    'ensuring accountability. The proposed payment structure distributes the total investment '
    'across four milestone-based payments, each tied to the successful delivery and acceptance '
    'of specific project outputs. This approach ensures that the client pays only for verified, '
    'working deliverables.',
    s_body
))

payment_table = make_table(
    [Paragraph('<b>Payment</b>', s_table_header),
     Paragraph('<b>Trigger</b>', s_table_header),
     Paragraph('<b>Percentage</b>', s_table_header)],
    [
        [Paragraph('First Installment', s_table_cell),
         Paragraph('Upon signing of the formal project agreement', s_table_cell),
         Paragraph('30%', s_table_cell_c)],
        [Paragraph('Second Installment', s_table_cell),
         Paragraph('Successful delivery and acceptance of Phase 1 and Phase 2 modules', s_table_cell),
         Paragraph('40%', s_table_cell_c)],
        [Paragraph('Third Installment', s_table_cell),
         Paragraph('Successful delivery of all remaining modules and completion of testing', s_table_cell),
         Paragraph('20%', s_table_cell_c)],
        [Paragraph('Final Installment', s_table_cell),
         Paragraph('After one month of stable production usage, post-launch adjustments addressed', s_table_cell),
         Paragraph('10%', s_table_cell_c)],
    ],
    col_ratios=[0.22, 0.58, 0.12]
)
story.append(Spacer(1, 6))
story.append(payment_table)
story.append(Paragraph('Table 7: Proposed Payment Schedule', s_caption))

story.append(add_heading('6.2 Recurring Costs', s_h2, level=1))
story.append(Paragraph(
    'Beyond the initial development investment, the only recurring cost is cloud infrastructure '
    'hosting. Because GHMS is built on a modern, serverless-optimized architecture (Next.js on Vercel), '
    'hosting costs are exceptionally low compared to traditional server-based deployments. For a '
    'deployment supporting up to 100 guest houses with moderate traffic, the estimated monthly '
    'infrastructure cost is between 2,000 and 5,000 ETB, scaling linearly as additional tenant '
    'capacity is required. There are no per-user licensing fees, no database licensing costs, and '
    'no third-party software subscriptions required for core functionality.',
    s_body
))


# ========================================================
# CHAPTER 7: BENEFITS AND ROI
# ========================================================
story.append(CondPageBreak(AVAIL_H * 0.25))
story.append(add_heading('7. Benefits and Return on Investment', s_h1, level=0))
story.append(divider())

story.append(Paragraph(
    'The benefits of GHMS extend across three stakeholder groups: guest house operators, law '
    'enforcement agencies, and government administrators. Each group receives measurable, '
    'tangible value that justifies the investment within the first year of deployment.',
    s_body
))

# 7.1
story.append(add_heading('7.1 Benefits for Guest House Operators', s_h2, level=1))
story.append(Paragraph(
    '<b>Elimination of Revenue Leakage:</b> By digitizing all financial transactions and automating '
    'reconciliation, GHMS captures revenue that would otherwise be lost to unrecorded cash payments, '
    'forgotten charges, or booking errors. Based on industry benchmarks from comparable markets, '
    'operators can expect to recover 8-15% of revenue that was previously leaking through manual '
    'process gaps. For a guest house with monthly revenue of 100,000 ETB, this translates to an '
    'additional 8,000-15,000 ETB per month in captured revenue.',
    s_body
))
story.append(Paragraph(
    '<b>Operational Efficiency:</b> Automating room status tracking, reservation management, and '
    'housekeeping scheduling reduces the administrative burden on staff by an estimated 40-60%. '
    'Tasks that previously required 30-45 minutes (such as manually checking room availability, '
    'recording a guest check-in, or compiling a monthly expense report) can be completed in under '
    '5 minutes. This freed-up capacity allows operators to focus on service quality and guest '
    'satisfaction rather than paperwork.',
    s_body
))
story.append(Paragraph(
    '<b>Data-Driven Decision Making:</b> Real-time dashboards and automated reports provide operators '
    'with instant visibility into occupancy rates, revenue trends, expense patterns, and guest '
    'satisfaction scores. This enables informed decisions about pricing adjustments, promotional '
    'campaigns, staffing levels, and capital investments, driving profitability improvements of '
    '15-25% for well-managed properties.',
    s_body
))
story.append(Paragraph(
    '<b>Professional Brand Image:</b> A modern, digital management system elevates the perceived '
    'quality of the establishment in the eyes of guests, particularly business travelers and '
    'international visitors who expect digital check-in processes and itemized invoices. This can '
    'directly translate into higher occupancy rates and the ability to command premium pricing.',
    s_body
))

# 7.2
story.append(add_heading('7.2 Benefits for Law Enforcement', s_h2, level=1))
story.append(Paragraph(
    '<b>Real-Time Situational Awareness:</b> The police dashboard provides a city-wide view of all '
    'registered guest houses, their occupancy levels, and guest counts. Investigators can search '
    'for any guest by name, phone number, or ID number across all establishments simultaneously, '
    'reducing investigation lead times from days or weeks to seconds. This capability is '
    'particularly valuable in time-sensitive investigations where rapid suspect location is critical.',
    s_body
))
story.append(Paragraph(
    '<b>Automated Threat Detection:</b> The seven-type anomaly detection engine identifies suspicious '
    'patterns that would be impossible for human investigators to spot manually across hundreds of '
    'establishments. The system acts as a force multiplier, enabling a small team of analysts to '
    'effectively monitor the entire guest house network. The risk scoring system ensures that '
    'investigators can prioritize their attention on the most serious threats rather than being '
    'overwhelmed by low-priority alerts.',
    s_body
))
story.append(Paragraph(
    '<b>Accountability and Audit Trail:</b> Every access to guest data by police personnel is '
    'logged with the officer’s identity, the action performed, the target data, and the IP address. '
    'This creates a transparent, auditable record that protects both the privacy rights of guests '
    'and the integrity of law enforcement operations. The joint session mechanism adds an additional '
    'layer of procedural safeguard for high-impact actions.',
    s_body
))

# 7.3
story.append(add_heading('7.3 Benefits for Government Administrators', s_h2, level=1))
story.append(Paragraph(
    '<b>Regulatory Compliance:</b> GHMS provides government administrators with a centralized platform '
    'for monitoring the guest house sector. Provider registration, approval, and compliance tracking '
    'are all managed digitally, eliminating the need for paper-based licensing processes. The system '
    'can generate compliance reports on demand, showing which establishments are properly registered, '
    'which subscriptions are active, and which properties may require regulatory attention.',
    s_body
))
story.append(Paragraph(
    '<b>Economic Development Data:</b> The aggregated, anonymized data collected by GHMS provides '
    'government planners with valuable insights into tourism patterns, occupancy trends, seasonal '
    'demand fluctuations, and regional hospitality capacity. This data can inform infrastructure '
    'investment decisions, tourism promotion strategies, and urban planning initiatives.',
    s_body
))
story.append(Paragraph(
    '<b>Scalable Revenue Model:</b> The subscription-based billing system creates a sustainable, '
    'predictable revenue stream for the platform operator. With four billing cycles and automated '
    'lifecycle management, the platform can scale to serve hundreds or thousands of guest houses '
    'without proportional increases in administrative overhead.',
    s_body
))

# Benefits summary table
benefit_table = make_table(
    [Paragraph('<b>Stakeholder</b>', s_table_header),
     Paragraph('<b>Key Benefit</b>', s_table_header),
     Paragraph('<b>Estimated Impact</b>', s_table_header)],
    [
        [Paragraph('Guest House Operators', s_table_cell),
         Paragraph('Revenue recovery from leakage elimination', s_table_cell),
         Paragraph('8-15% additional revenue per month', s_table_cell_c)],
        [Paragraph('Guest House Operators', s_table_cell),
         Paragraph('Administrative time reduction', s_table_cell),
         Paragraph('40-60% reduction in paperwork time', s_table_cell_c)],
        [Paragraph('Guest House Operators', s_table_cell),
         Paragraph('Data-driven profitability improvements', s_table_cell),
         Paragraph('15-25% profit increase', s_table_cell_c)],
        [Paragraph('Law Enforcement', s_table_cell),
         Paragraph('Investigation lead time reduction', s_table_cell),
         Paragraph('From days/weeks to seconds', s_table_cell_c)],
        [Paragraph('Law Enforcement', s_table_cell),
         Paragraph('Automated suspicious pattern detection', s_table_cell),
         Paragraph('7 anomaly types, risk-scored', s_table_cell_c)],
        [Paragraph('Government', s_table_cell),
         Paragraph('Digital regulatory compliance tracking', s_table_cell),
         Paragraph('100% of providers tracked digitally', s_table_cell_c)],
        [Paragraph('Government', s_table_cell),
         Paragraph('Tourism and economic development data', s_table_cell),
         Paragraph('Real-time sector-wide analytics', s_table_cell_c)],
    ],
    col_ratios=[0.22, 0.42, 0.28]
)
story.append(Spacer(1, 6))
story.append(benefit_table)
story.append(Paragraph('Table 8: Benefits Summary by Stakeholder', s_caption))


# ========================================================
# CHAPTER 8: TECHNOLOGY STACK
# ========================================================
story.append(CondPageBreak(AVAIL_H * 0.25))
story.append(add_heading('8. Technology Stack', s_h1, level=0))
story.append(divider())

story.append(Paragraph(
    'GHMS is built using proven, industry-standard technologies that prioritize reliability, '
    'security, performance, and long-term maintainability. The technology choices reflect a '
    'deliberate balance between cutting-edge capabilities and production stability, ensuring that '
    'the platform benefits from modern development practices without the risks associated with '
    'unproven or experimental technologies.',
    s_body
))

tech_table = make_table(
    [Paragraph('<b>Layer</b>', s_table_header),
     Paragraph('<b>Technology</b>', s_table_header),
     Paragraph('<b>Purpose</b>', s_table_header)],
    [
        [Paragraph('Framework', s_table_cell),
         Paragraph('Next.js 16 (App Router, React 19)', s_table_cell),
         Paragraph('Server-side rendering, API routes, edge runtime, optimized builds', s_table_cell)],
        [Paragraph('Language', s_table_cell),
         Paragraph('TypeScript 5', s_table_cell),
         Paragraph('Type safety, developer productivity, maintainable codebase', s_table_cell)],
        [Paragraph('UI Components', s_table_cell),
         Paragraph('shadcn/ui, Tailwind CSS 4', s_table_cell),
         Paragraph('40+ accessible components, responsive design, consistent styling', s_table_cell)],
        [Paragraph('Database ORM', s_table_cell),
         Paragraph('Prisma 6', s_table_cell),
         Paragraph('Type-safe database access, migrations, schema management', s_table_cell)],
        [Paragraph('Database', s_table_cell),
         Paragraph('PostgreSQL', s_table_cell),
         Paragraph('ACID-compliant relational storage, full-text search, JSON support', s_table_cell)],
        [Paragraph('Authentication', s_table_cell),
         Paragraph('JWT (jose), bcrypt', s_table_cell),
         Paragraph('Secure httpOnly cookie tokens, password hashing, role-based access', s_table_cell)],
        [Paragraph('State Management', s_table_cell),
         Paragraph('Zustand 5', s_table_cell),
         Paragraph('Client-side global state with localStorage persistence', s_table_cell)],
        [Paragraph('Charts', s_table_cell),
         Paragraph('Recharts 3', s_table_cell),
         Paragraph('Interactive data visualizations and analytics dashboards', s_table_cell)],
        [Paragraph('Hosting', s_table_cell),
         Paragraph('Vercel (cloud)', s_table_cell),
         Paragraph('Global CDN, automatic scaling, zero-config deployments', s_table_cell)],
        [Paragraph('File Storage', s_table_cell),
         Paragraph('Vercel Blob / S3', s_table_cell),
         Paragraph('Pluggable storage for documents, images, and licenses', s_table_cell)],
    ],
    col_ratios=[0.18, 0.28, 0.46]
)
story.append(Spacer(1, 6))
story.append(tech_table)
story.append(Paragraph('Table 9: Technology Stack', s_caption))

story.append(Paragraph(
    'The choice of Vercel for cloud hosting is strategic: it provides automatic scaling, global '
    'content delivery, and zero-configuration deployments, which dramatically reduces operational '
    'overhead compared to traditional server management. The platform can also be self-hosted on '
    'any Linux server for organizations that prefer full data sovereignty, with a Caddy reverse '
    'proxy configuration included for straightforward deployment.',
    s_body
))


# ========================================================
# CHAPTER 9: WHY CHOOSE US
# ========================================================
story.append(CondPageBreak(AVAIL_H * 0.25))
story.append(add_heading('9. Why Choose Us', s_h1, level=0))
story.append(divider())

story.append(Paragraph(
    'We bring a unique combination of deep technical expertise and thorough understanding of the '
    'Ethiopian hospitality and regulatory landscape that makes us the ideal partner for this '
    'digital transformation initiative. Our team has first-hand experience with the specific '
    'challenges faced by guest house operators and law enforcement agencies in Ethiopia, including '
    'infrastructure limitations, connectivity constraints, budget sensitivities, and the need for '
    'systems that work reliably in production environments.',
    s_body
))
story.append(Paragraph(
    'GHMS is not a theoretical proposal or a generic software template adapted for the Ethiopian '
    'market. It is a fully functional, production-tested platform that has been developed with '
    'meticulous attention to the real-world workflows of guest house operators and the operational '
    'requirements of law enforcement agencies. The system currently comprises over 50 API endpoints, '
    '31 distinct page components, 22 database models, and a sophisticated seven-type anomaly '
    'detection engine — all built, tested, and optimized for the specific conditions of the '
    'Ethiopian market.',
    s_body
))
story.append(Paragraph(
    'Our commitment extends well beyond the initial delivery. We include comprehensive on-site '
    'training for all user groups, detailed user manuals and quick-reference guides, and twelve '
    'months of post-launch technical support at no additional cost. We design all systems with '
    'long-term scalability in mind, ensuring that as the network of guest houses grows, as '
    'regulatory requirements evolve, or as new feature needs emerge, the platform can be extended '
    'and enhanced without requiring a complete rebuild. Data security is embedded in every layer of '
    'the architecture, from encrypted authentication tokens and isolated multi-tenant data to '
    'comprehensive audit logging and dual-authorization emergency procedures.',
    s_body
))


# ========================================================
# CHAPTER 10: NEXT STEPS
# ========================================================
story.append(CondPageBreak(AVAIL_H * 0.25))
story.append(add_heading('10. Next Steps', s_h1, level=0))
story.append(divider())

story.append(Paragraph(
    'We are prepared to begin this partnership immediately and deliver a system that will '
    'meaningfully improve the efficiency, profitability, and safety of the guest house sector. '
    'The following steps outline the immediate actions required to formalize the engagement and '
    'initiate the project. We recommend moving quickly to maintain momentum and begin delivering '
    'results as soon as possible.',
    s_body
))

next_steps = make_table(
    [Paragraph('<b>Step</b>', s_table_header),
     Paragraph('<b>Action</b>', s_table_header),
     Paragraph('<b>Timeline</b>', s_table_header),
     Paragraph('<b>Responsible</b>', s_table_header)],
    [
        [Paragraph('1', s_table_cell_c),
         Paragraph('Review and sign the formal project agreement', s_table_cell),
         Paragraph('Week 1', s_table_cell_c),
         Paragraph('Stakeholder Leadership', s_table_cell)],
        [Paragraph('2', s_table_cell_c),
         Paragraph('Conduct kick-off meeting and finalize requirements for Phase 1', s_table_cell),
         Paragraph('Week 1-2', s_table_cell_c),
         Paragraph('Both Parties', s_table_cell)],
        [Paragraph('3', s_table_cell_c),
         Paragraph('Provide existing data samples, format requirements, and user access lists', s_table_cell),
         Paragraph('Week 2', s_table_cell_c),
         Paragraph('Client Team', s_table_cell)],
        [Paragraph('4', s_table_cell_c),
         Paragraph('Development of Phase 1 (Operations and Financial Management) begins', s_table_cell),
         Paragraph('Week 2', s_table_cell_c),
         Paragraph('Development Team', s_table_cell)],
        [Paragraph('5', s_table_cell_c),
         Paragraph('First progress review, demonstration, and feedback session', s_table_cell),
         Paragraph('Week 5', s_table_cell_c),
         Paragraph('Both Parties', s_table_cell)],
    ],
    col_ratios=[0.07, 0.44, 0.12, 0.25]
)
story.append(Spacer(1, 6))
story.append(next_steps)
story.append(Paragraph('Table 10: Immediate Next Steps', s_caption))

story.append(Paragraph(
    'We are available at your earliest convenience to discuss this proposal in detail, answer '
    'any questions, and begin the formal engagement process. Our team is committed to delivering '
    'a system that will meaningfully improve operational efficiency across the guest house sector, '
    'strengthen public safety through intelligent monitoring, and generate sustainable value for '
    'all stakeholders involved. We look forward to your favorable response and to building a '
    'lasting partnership that contributes to the modernization of Ethiopia’s hospitality industry.',
    s_body
))


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# BUILD PDF
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
doc = TocDocTemplate(
    OUTPUT_BODY,
    pagesize=A4,
    leftMargin=LEFT_M,
    rightMargin=RIGHT_M,
    topMargin=TOP_M,
    bottomMargin=BOTTOM_M,
    title='GHMS - Guest House Management System Proposal',
    author='Z.ai',
    creator='Z.ai',
    subject='Technical and Financial Proposal for GHMS Digital Transformation'
)

doc.multiBuild(story, onLaterPages=header_footer, onFirstPage=header_footer)
print('Body PDF generated:', OUTPUT_BODY)
