#!/usr/bin/env python3
"""Generate GHMS Business Proposal PDF body (cover merged separately)."""

import os
import sys

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate,
    PageTemplate,
    Frame,
    Paragraph,
    Spacer,
    PageBreak,
    Image,
    Table,
    TableStyle,
    KeepTogether,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Palette ────────────────────────────────────────────────────────────
PAGE_BG       = colors.HexColor('#f0f2f2')
SECTION_BG    = colors.HexColor('#f1f2f3')
CARD_BG       = colors.HexColor('#e9ebec')
TABLE_STRIPE  = colors.HexColor('#e8ebec')
HEADER_FILL   = colors.HexColor('#4d6571')
COVER_BLOCK   = colors.HexColor('#57717e')
BORDER        = colors.HexColor('#cbd3d6')
ICON          = colors.HexColor('#447187')
ACCENT        = colors.HexColor('#3a90bb')
ACCENT_2      = colors.HexColor('#49ba49')
TEXT_PRIMARY   = colors.HexColor('#161819')
TEXT_MUTED     = colors.HexColor('#72797c')
SEM_SUCCESS   = colors.HexColor('#529067')
SEM_WARNING   = colors.HexColor('#aa8844')
SEM_ERROR     = colors.HexColor('#a25b54')
SEM_INFO      = colors.HexColor('#507aa4')

# ── Paths ──────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FIG_DIR = os.path.join(SCRIPT_DIR, 'proposal_figures')
OUTPUT_PATH = os.path.join(SCRIPT_DIR, 'proposal_body.pdf')
FIG1 = os.path.join(FIG_DIR, 'fig1_problem.png')
FIG2 = os.path.join(FIG_DIR, 'fig2_revenue.png')
FIG3 = os.path.join(FIG_DIR, 'fig3_breakeven.png')
FIG4 = os.path.join(FIG_DIR, 'fig4_architecture.png')
FIG5 = os.path.join(FIG_DIR, 'fig5_benefits.png')

# ── Page geometry ──────────────────────────────────────────────────────
PAGE_W, PAGE_H = A4
LEFT_M = RIGHT_M = 1 * inch
TOP_M = BOT_M = 0.9 * inch
AVAIL_W = PAGE_W - LEFT_M - RIGHT_M  # ~451.5 pt
CONTENT_H = PAGE_H - TOP_M - BOT_M

# ── Register fonts ─────────────────────────────────────────────────────
pdfmetrics.registerFont(TTFont('FreeSerif', '/usr/share/fonts/truetype/freefont/FreeSerif.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Bold', '/usr/share/fonts/truetype/freefont/FreeSerifBold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Italic', '/usr/share/fonts/truetype/freefont/FreeSerifItalic.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans', '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'))

pdfmetrics.registerFontFamily(
    'FreeSerif',
    normal='FreeSerif',
    bold='FreeSerif-Bold',
    italic='FreeSerif-Italic',
)

# ── Styles ─────────────────────────────────────────────────────────────
body_style = ParagraphStyle(
    'Body', fontName='FreeSerif', fontSize=10.5, leading=16,
    alignment=TA_JUSTIFY, spaceAfter=6, textColor=TEXT_PRIMARY,
)

h1_style = ParagraphStyle(
    'H1', fontName='FreeSerif-Bold', fontSize=16, leading=20,
    spaceBefore=18, spaceAfter=12, textColor=TEXT_PRIMARY, keepWithNext=True,
)

h2_style = ParagraphStyle(
    'H2', fontName='FreeSerif-Bold', fontSize=12, leading=16,
    spaceBefore=12, spaceAfter=8, textColor=colors.white,
    backColor=HEADER_FILL, leftIndent=0,
    borderPadding=(4, 6, 4, 6), keepWithNext=True,
)

caption_style = ParagraphStyle(
    'Caption', fontName='FreeSerif-Italic', fontSize=9, leading=12,
    alignment=TA_CENTER, textColor=TEXT_MUTED, spaceBefore=2, spaceAfter=6,
)

bullet_style = ParagraphStyle(
    'Bullet', fontName='FreeSerif', fontSize=10.5, leading=16,
    alignment=TA_LEFT, spaceAfter=4, textColor=TEXT_PRIMARY,
    leftIndent=18, bulletIndent=6,
    bulletFontName='FreeSerif-Bold', bulletFontSize=10.5,
)

toc_title_style = ParagraphStyle(
    'TOCTitle', fontName='FreeSerif-Bold', fontSize=18, leading=24,
    alignment=TA_LEFT, spaceBefore=12, spaceAfter=18, textColor=TEXT_PRIMARY,
)

th_style = ParagraphStyle(
    'TH', fontName='FreeSerif-Bold', fontSize=9.5, leading=13,
    textColor=colors.white, alignment=TA_LEFT,
)

tc_style = ParagraphStyle(
    'TC', fontName='FreeSerif', fontSize=9.5, leading=13,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT,
)

# ── Helper functions ───────────────────────────────────────────────────

def H1(text, num):
    heading = Paragraph(f'{num}. {text}', h1_style)
    hr = Table([['']], colWidths=[AVAIL_W], rowHeights=[1])
    hr.setStyle(TableStyle([
        ('LINEABOVE', (0, 0), (-1, 0), 0.5,
         colors.Color(BORDER.red, BORDER.green, BORDER.blue, 0.4)),
    ]))
    return [heading, Spacer(1, 2), hr, Spacer(1, 6)]


def P(text):
    return Paragraph(text, body_style)


def H2(text):
    return Paragraph(text, h2_style)


def Bullet(text):
    return Paragraph(f'\u2022  {text}', bullet_style)


def Caption(text):
    return Paragraph(text, caption_style)


def safe_keep(elements):
    if len(elements) == 1:
        return elements[0]
    return KeepTogether(elements)


def embed_image(path, cap):
    img = Image(path, width=AVAIL_W, height=AVAIL_W * 0.55)
    img.hAlign = 'CENTER'
    return [Spacer(1, 12), img, Caption(cap), Spacer(1, 12)]


def make_table(header_row, data_rows, col_widths):
    hdr = [Paragraph(str(c), th_style) for c in header_row]
    rows = [hdr]
    for r in data_rows:
        rows.append([Paragraph(str(c), tc_style) for c in r])
    t = Table(rows, colWidths=col_widths, repeatRows=1)
    cmds = [
        ('BACKGROUND', (0, 0), (-1, 0), HEADER_FILL),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]
    for i in range(1, len(rows)):
        bg = TABLE_STRIPE if i % 2 == 1 else colors.white
        cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(cmds))
    return t


# ── TocDocTemplate ─────────────────────────────────────────────────────
class TocDocTemplate(BaseDocTemplate):
    def __init__(self, filename, **kw):
        BaseDocTemplate.__init__(self, filename, **kw)
        self._toc_pages = 0
        frame = Frame(LEFT_M, BOT_M, AVAIL_W, CONTENT_H, id='normal')
        self.addPageTemplates(PageTemplate(id='body', frames=frame, onPage=self._page))

    def _page(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(PAGE_BG)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        pn = doc.page
        canvas.setFont('FreeSerif', 9)
        canvas.setFillColor(TEXT_MUTED)
        canvas.drawCentredString(PAGE_W / 2.0, 0.5 * inch, str(pn))
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph):
            sn = flowable.style.name
            txt = flowable.getPlainText()
            if sn == 'H1':
                key = f'h1_{id(flowable)}'
                self.canv.bookmarkPage(key)
                self.notify('TOCEntry', (0, txt, self.page, key))
            elif sn == 'H2':
                key = f'h2_{id(flowable)}'
                self.canv.bookmarkPage(key)
                self.notify('TOCEntry', (1, txt, self.page, key))


# ── Story builder ──────────────────────────────────────────────────────
def build_story():
    story = []

    # ── TOC ────────────────────────────────────────────────────────────
    story.append(Paragraph('Table of Contents', toc_title_style))
    toc = TableOfContents()
    toc.levelStyles = [
        ParagraphStyle('TOC1', fontName='FreeSerif-Bold', fontSize=12, leading=20,
                        leftIndent=0, spaceBefore=6, spaceAfter=2, textColor=TEXT_PRIMARY),
        ParagraphStyle('TOC2', fontName='FreeSerif', fontSize=10.5, leading=18,
                        leftIndent=20, spaceBefore=2, spaceAfter=1, textColor=TEXT_MUTED),
    ]
    story.append(toc)
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════
    # CH 1 — Executive Summary
    # ═══════════════════════════════════════════════════════════════════
    story.extend(H1('Executive Summary', 1))
    story.append(safe_keep([
        P('The Guest House Management System (GHMS) is a comprehensive, cloud-based digital platform '
          'purpose-built to transform how guest houses operate across Ethiopia. Developed with a modern '
          'technology stack comprising Next.js 16, React 19, PostgreSQL, and Prisma 6, GHMS addresses '
          'the fragmented and largely paper-based guest house management landscape that currently dominates '
          'the Ethiopian hospitality sector.'),
        P('At its core, GHMS provides unified operations management for guest house owners, enabling them '
          'to handle reservations, guest registrations, room management, housekeeping schedules, expense '
          'tracking, and payment processing from a single, intuitive dashboard. Beyond operational efficiency, '
          'the platform integrates a dedicated police intelligence module that enables law enforcement agencies '
          'to monitor guest movements, flag suspicious individuals, and receive real-time alerts—a feature '
          'unprecedented in the Ethiopian guest house industry.'),
    ]))
    story.append(P(
        'The system is fully developed and currently deployed on a local production server with 8 GB of RAM, '
        '1 TB of storage, and a public IP address. The company has already invested in all infrastructure, '
        'including the physical server, networking equipment, and software development. This means that guest '
        'house owners can adopt the platform with zero upfront cost, paying only a modest monthly subscription '
        'fee that covers hosting, maintenance, security updates, and ongoing technical support.'
    ))
    story.append(P(
        'The subscription-based revenue model ensures long-term sustainability. Revenue is generated exclusively '
        'from guest house subscription fees—the company does not charge guests, law enforcement agencies, or '
        'any third party. With four flexible pricing tiers ranging from 500 ETB per month to 4,800 ETB per year, '
        'GHMS is accessible to guest houses of all sizes. Financial projections indicate break-even at approximately '
        '18 subscribers, with significant revenue growth potential as adoption scales across Ethiopia’s '
        'thousands of guest houses.'
    ))
    story.append(P(
        'This proposal presents a detailed examination of the problem GHMS solves, the technical architecture, '
        'the revenue model, cost analysis, benefits, risks, and a phased implementation roadmap. GHMS is not a '
        'theoretical concept—it is a fully functional, deployed, and tested system ready for immediate '
        'commercial deployment and stakeholder engagement.'
    ))
    story.append(Spacer(1, 18))

    # ═══════════════════════════════════════════════════════════════════
    # CH 2 — Problem Statement
    # ═══════════════════════════════════════════════════════════════════
    story.extend(H1('Problem Statement', 2))
    story.append(P(
        'Ethiopia’s guest house industry has experienced significant growth over the past decade, driven by '
        'increasing domestic tourism, expanding business travel, and the influx of international visitors and '
        'diaspora returnees. However, the operational infrastructure supporting this growth has not kept pace. '
        'The vast majority of guest houses across the country—from Addis Ababa to regional capitals and tourist '
        'destinations—continue to rely on manual, paper-based processes for virtually every aspect of their '
        'operations.'
    ))
    story.append(P(
        'Guest registration remains a handwritten affair in most establishments. Visitors fill out paper ledgers '
        'upon arrival, providing basic information such as name, nationality, and identification number. These '
        'ledgers are difficult to search, impossible to analyze at scale, and highly vulnerable to damage or loss. '
        'There is no real-time data sharing between guest houses, and law enforcement agencies have no centralized '
        'access to guest movement information. This creates significant security blind spots that have been '
        'exploited by criminal elements in the past.'
    ))
    story.append(P(
        'Room management is equally antiquated. Most guest houses use physical key racks, manual occupancy boards, '
        'and verbal communication between front desk staff and housekeeping teams. Double bookings occur frequently, '
        'leading to guest dissatisfaction and revenue loss. Check-in and check-out times are not systematically '
        'tracked, and room availability is often unknown until a staff member physically inspects the premises. '
        'Housekeeping schedules are informal and reactive rather than proactive, resulting in inconsistent service quality.'
    ))
    story.append(P(
        'Financial record-keeping presents another critical challenge. Revenue from room bookings, food services, '
        'and ancillary charges is often recorded in separate, disconnected ledgers. Many guest house owners cannot '
        'accurately determine their monthly revenue, occupancy rates, or most profitable services. Tax compliance '
        'becomes a guessing game, and the lack of auditable financial records exposes owners to regulatory risk. '
        'Expenses are tracked haphazardly, making it impossible to identify cost-saving opportunities or measure '
        'profitability accurately.'
    ))
    story.append(P(
        'Perhaps most critically, the absence of any digital integration with law enforcement represents a '
        'fundamental security gap. Police and security agencies have no mechanism to track persons of interest '
        'across guest houses, receive alerts about suspicious check-ins, or analyze patterns of criminal activity. '
        'In an era where digital surveillance and intelligence-sharing are standard practice in the global '
        'hospitality industry, Ethiopia’s guest houses remain dangerously disconnected from the national security '
        'infrastructure.'
    ))
    story.extend(embed_image(FIG1, 'Figure 1: Comparison of manual versus digital guest house management processes.'))
    story.append(P(
        'These interconnected challenges create a compounding effect: poor data management leads to poor decision-making, '
        'which leads to operational inefficiency, which leads to reduced revenue, which limits investment in improvement. '
        'Breaking this cycle requires a comprehensive digital solution that addresses all aspects of guest house '
        'management simultaneously—which is precisely what GHMS delivers.'
    ))
    story.append(Spacer(1, 18))

    # ═══════════════════════════════════════════════════════════════════
    # CH 3 — Proposed Solution
    # ═══════════════════════════════════════════════════════════════════
    story.extend(H1('Proposed Solution', 3))
    story.append(P(
        'GHMS is a fully integrated, multi-tenant digital platform designed to address every operational challenge '
        'facing Ethiopian guest houses. Built on a robust multi-tenant architecture, each guest house operates as a '
        'completely isolated tenant with its own data, configurations, and user accounts, ensuring data privacy and '
        'security while benefiting from shared infrastructure and centralized maintenance.'
    ))
    story.append(P(
        'The platform encompasses 21 carefully designed database models that capture every aspect of guest house '
        'operations. This comprehensive data model enables powerful analytics, seamless module integration, and '
        'the flexibility to accommodate diverse operational requirements across different guest house types and sizes.'
    ))
    story.append(H2('Core Operational Modules'))
    story.append(P(
        'The operational heart of GHMS consists of several tightly integrated modules. The Dashboard module provides '
        'a real-time overview of key metrics including occupancy rates, revenue, upcoming check-ins and check-outs, and '
        'housekeeping status. The Reservations module handles the complete booking lifecycle from creation through '
        'confirmation, modification, and completion, with automatic room assignment and conflict prevention. The Guest '
        'Registry module maintains comprehensive digital records of all guests, including identification documents, '
        'contact information, stay history, and special requirements.'
    ))
    story.append(P(
        'Room Management enables real-time tracking of room status (available, occupied, maintenance, cleaning), '
        'categorized by room type and amenities. The Housekeeping module generates automated task lists based on '
        'room status changes and allows management to track task completion in real time. Expense Tracking provides '
        'a categorized ledger for all operational expenditures, enabling owners to understand their cost structure. '
        'The Payments module records all financial transactions, generates invoices, and supports multiple payment methods.'
    ))
    story.append(H2('Communication and Quality Modules'))
    story.append(P(
        'GHMS includes a Notifications module that delivers automated alerts via in-app notifications and email for '
        'events such as new bookings, upcoming check-outs, payment confirmations, and system announcements. The Reviews '
        'module allows guests to provide feedback on their stay, giving guest house owners actionable insights for '
        'service improvement and providing a transparent quality signal to prospective guests.'
    ))
    story.append(H2('Police Intelligence Module'))
    story.append(P(
        'One of GHMS’s most distinctive features is its Police Intelligence module, which provides law enforcement '
        'agencies with powerful tools for guest monitoring and security. The Suspect Matching feature automatically '
        'cross-references incoming guest registrations against a police-maintained watchlist, flagging potential matches '
        'for immediate review. The Geofencing capability allows authorities to define virtual perimeters and receive '
        'alerts when persons of interest check into guest houses within specified areas. Frequent Stay Analysis identifies '
        'unusual patterns—such as the same individual registering at multiple guest houses within a short period—which '
        'may indicate suspicious activity. This module is fully funded by the company and provided at no additional cost '
        'to law enforcement agencies.'
    ))
    story.append(H2('Administration and Subscription'))
    story.append(P(
        'The Subscription Management module handles the complete subscription lifecycle including plan selection, '
        'payment processing via Telebirr, renewal reminders, and tier upgrades. A comprehensive Super Admin panel '
        'provides the GHMS team with full visibility into system operations, user management, subscription status, '
        'and platform analytics across all tenants.'
    ))
    story.extend(embed_image(FIG4, 'Figure 2: GHMS system architecture showing multi-tenant design and module integration.'))
    story.append(Spacer(1, 18))

    # ═══════════════════════════════════════════════════════════════════
    # CH 4 — System Architecture
    # ═══════════════════════════════════════════════════════════════════
    story.extend(H1('System Architecture', 4))
    story.append(P(
        'GHMS is built on a carefully selected modern technology stack optimized for reliability, performance, and '
        'maintainability. The architecture follows industry best practices for production-grade web applications, '
        'ensuring the platform can scale seamlessly as subscriber numbers grow from dozens to hundreds.'
    ))
    story.append(P(
        'The frontend is built with Next.js 16 utilizing the App Router architecture, providing server-side rendering, '
        'client-side navigation, and optimized code splitting for fast page loads. React 19 powers the component layer, '
        'delivering a responsive, interactive user interface. Tailwind CSS provides a utility-first styling approach that '
        'ensures design consistency and rapid UI development. User authentication is handled via JSON Web Tokens (JWT) '
        'with secure, httpOnly cookie-based sessions.'
    ))
    story.append(P(
        'The backend leverages Next.js API routes and Prisma 6 as the ORM layer, providing type-safe database access '
        'and efficient query optimization. PostgreSQL serves as the primary database, chosen for its robustness, '
        'ACID compliance, and excellent support for complex queries and multi-tenant data isolation. The multi-tenant '
        'architecture ensures complete data separation between guest houses while sharing a single database instance for '
        'operational efficiency.'
    ))
    story.append(P(
        'The production deployment runs on an Ubuntu Server with a standalone Next.js build for optimal performance. '
        'Caddy serves as the reverse proxy, providing automatic SSL/TLS certificate management via Let’s Encrypt, HTTP/2 '
        'support, and efficient static asset serving. Systemd manages the application process with automatic restart '
        'capabilities, ensuring maximum uptime. The server currently operates with 8 GB RAM, 1 TB storage, and a '
        'public IP address, providing ample resources for the initial growth phase.'
    ))

    # Tech specs table
    tech_data = [
        ['Frontend Framework', 'Next.js (App Router)', '16', 'SSR, routing, API layer'],
        ['UI Library', 'React', '19', 'Component-based UI'],
        ['Styling', 'Tailwind CSS', '4', 'Utility-first CSS framework'],
        ['ORM', 'Prisma', '6', 'Type-safe database access'],
        ['Database', 'PostgreSQL', '16', 'Relational data storage'],
        ['Authentication', 'JWT', '—', 'Stateless token-based auth'],
        ['Reverse Proxy', 'Caddy', '2', 'Auto-SSL, HTTP/2'],
        ['Process Manager', 'systemd', '—', 'Auto-restart, logging'],
        ['Operating System', 'Ubuntu Server', '24.04', 'Linux production OS'],
        ['Build Mode', 'Standalone', '—', 'Optimized production build'],
    ]
    story.append(Spacer(1, 12))
    cw = [AVAIL_W * 0.22, AVAIL_W * 0.22, AVAIL_W * 0.12, AVAIL_W * 0.44]
    story.append(make_table(
        ['Component', 'Technology', 'Version', 'Purpose'],
        tech_data,
        cw,
    ))
    story.append(Caption('Table 1: GHMS Technical Specifications'))
    story.append(Spacer(1, 18))

    # ═══════════════════════════════════════════════════════════════════
    # CH 5 — Subscription Revenue Model
    # ═══════════════════════════════════════════════════════════════════
    story.extend(H1('Subscription Revenue Model', 5))
    story.append(P(
        'The GHMS revenue model is designed for clarity, sustainability, and accessibility. The company covers all '
        'costs—development, hosting, infrastructure, maintenance, and police intelligence platform operations. '
        'Revenue is generated exclusively from subscription fees paid by guest house owners. This structure ensures '
        'that the platform’s financial health is directly tied to the value it delivers to its users.'
    ))
    story.append(P(
        'Four subscription tiers have been designed to accommodate guest houses of varying sizes and budgets. Each tier '
        'provides identical access to all GHMS features and modules; the only difference is the billing period and the '
        'corresponding per-month savings for longer commitments. There are no hidden fees, no per-guest charges, and no '
        'additional costs for the police intelligence module.'
    ))

    # Pricing table
    pricing_data = [
        ['Monthly', '500 ETB', '500 ETB', 'Maximum flexibility'],
        ['Quarterly', '1,400 ETB', '~467 ETB', '6.7% savings over monthly'],
        ['Semi-Annual', '2,600 ETB', '~433 ETB', '13.3% savings over monthly'],
        ['Annual', '4,800 ETB', '400 ETB', '20% savings over monthly'],
    ]
    story.append(Spacer(1, 12))
    pcw = [AVAIL_W * 0.18, AVAIL_W * 0.20, AVAIL_W * 0.17, AVAIL_W * 0.45]
    story.append(make_table(
        ['Plan', 'Total Price', 'Per Month', 'Value Proposition'],
        pricing_data,
        pcw,
    ))
    story.append(Caption('Table 2: GHMS Subscription Pricing Tiers'))
    story.append(Spacer(1, 8))
    story.append(P(
        'The monthly plan at 500 ETB is deliberately priced to be accessible even to small guest houses in regional '
        'cities. For context, this is less than the cost of a single night’s room rental at most Ethiopian guest houses, '
        'making it an easy investment decision. The annual plan at 4,800 ETB represents the best value, reducing the '
        'effective monthly cost to just 400 ETB—a 20% saving that rewards committed partners.'
    ))
    story.append(P(
        'Payment processing will be integrated with Telebirr, Ethiopia’s leading mobile money platform, ensuring that '
        'subscription payments are convenient and accessible even for guest house owners without traditional bank accounts. '
        'The subscription management module handles automatic renewal reminders, grace periods, and seamless plan upgrades, '
        'minimizing administrative overhead for both the GHMS team and subscriber businesses.'
    ))
    story.extend(embed_image(FIG2, 'Figure 3: Five-year revenue projection based on subscriber growth trajectory.'))
    story.append(P(
        'The five-year revenue projection model assumes conservative subscriber growth, starting with 10 subscribers in '
        'the first quarter and scaling to approximately 500 subscribers by Year 3. Even at the most conservative estimates, '
        'the platform generates sufficient revenue to cover all operational costs by Month 18, with accelerating profit '
        'thereafter. Revenue potential scales linearly with subscriber acquisition, and the low marginal cost per additional '
        'subscriber means that profit margins improve significantly as the subscriber base grows.'
    ))
    story.append(Spacer(1, 18))

    # ═══════════════════════════════════════════════════════════════════
    # CH 6 — Cost Analysis and Break-Even
    # ═══════════════════════════════════════════════════════════════════
    story.extend(H1('Cost Analysis and Break-Even', 6))
    story.append(P(
        'A transparent cost analysis is essential for stakeholder confidence. Unlike many technology ventures that require '
        'ongoing capital injection, GHMS has been designed with a lean cost structure that minimizes fixed expenses and '
        'maximizes the percentage of subscription revenue that contributes to sustainability and growth.'
    ))
    story.append(H2('Company-Absorbed Costs'))
    story.append(P(
        'The company has already invested in and continues to absorb all costs associated with the platform. These costs '
        'fall into three primary categories:'
    ))
    story.append(P(
        '<b>Development Cost:</b> The entire GHMS platform—including the frontend, backend, database schema, police '
        'intelligence module, and all 21 data models—has been fully developed. The total development investment is '
        'amortized at approximately 150,000 ETB over 36 months, resulting in a monthly development cost allocation of '
        'roughly 4,167 ETB. This is a sunk cost that has already been incurred; the amortization is an accounting treatment '
        'for break-even analysis purposes.'
    ))
    story.append(P(
        '<b>Hosting and Management:</b> The platform runs on Ethio Telecom fiber connectivity with a static public IP '
        'address. Monthly internet and connectivity costs amount to approximately 4,720 ETB. Server management, including '
        'monitoring, backups, security patches, and technical support, is handled by the GHMS development team as part of '
        'the company’s operational commitment.'
    ))
    story.append(P(
        '<b>Infrastructure:</b> The local production server (8 GB RAM, 1 TB storage) and all networking equipment have '
        'been purchased and are owned outright by the company. No leasing costs or financing obligations are associated with '
        'the hardware. The police/law enforcement intelligence platform is also fully funded by the company as a public '
        'safety contribution, with no cost passed on to guest houses or government agencies.'
    ))

    cost_data = [
        ['Development (amortized)', '~4,167 ETB', 'Sunk cost, 36-month amortization'],
        ['Hosting (fiber + IP)', '~4,720 ETB', 'Ethio Telecom monthly fee'],
        ['Infrastructure (server)', '0 ETB', 'Already owned by company'],
        ['Police intelligence platform', '0 ETB', 'Fully funded by company'],
        ['Contingency (misc.)', '~200 ETB', 'Domain, SSL, misc. costs'],
        ['<b>Total Monthly Cost</b>', '<b>~9,087 ETB</b>', '<b>All borne by company</b>'],
    ]
    story.append(Spacer(1, 12))
    ccw = [AVAIL_W * 0.30, AVAIL_W * 0.20, AVAIL_W * 0.50]
    story.append(make_table(
        ['Cost Category', 'Monthly Amount', 'Notes'],
        cost_data,
        ccw,
    ))
    story.append(Caption('Table 3: Monthly Cost Breakdown (All Absorbed by Company)'))
    story.append(Spacer(1, 8))
    story.append(P(
        'At an average revenue of 500 ETB per subscriber per month (using the monthly plan as the baseline), the platform '
        'requires approximately 18 subscribers to reach break-even. Based on the phased implementation roadmap, this threshold '
        'is projected to be reached around Month 18 of operations. Every subscriber beyond the 18th contributes directly to '
        'the platform’s financial surplus, which can be reinvested in feature development, marketing, and infrastructure upgrades.'
    ))
    story.extend(embed_image(FIG3, 'Figure 4: Break-even analysis showing cost versus revenue trajectories over 36 months.'))
    story.append(Spacer(1, 18))

    # ═══════════════════════════════════════════════════════════════════
    # CH 7 — Benefits and Impact
    # ═══════════════════════════════════════════════════════════════════
    story.extend(H1('Benefits and Impact', 7))
    story.append(P(
        'GHMS delivers measurable benefits across multiple dimensions: operational efficiency for guest house owners, '
        'enhanced safety and security through law enforcement integration, regulatory compliance, and broader economic '
        'impact on the Ethiopian hospitality sector.'
    ))
    story.append(H2('Operational Efficiency'))
    story.append(P(
        'By digitizing all core operations, GHMS eliminates the time-consuming manual processes that currently consume '
        'hours of staff time daily. Automated reservation management prevents double bookings and optimizes room allocation. '
        'Digital guest registration reduces check-in time from several minutes to under a minute. Real-time dashboard data '
        'enables owners to make informed decisions about pricing, staffing, and marketing. Housekeeping automation ensures rooms '
        'are cleaned promptly after check-out, improving guest satisfaction and enabling faster room turnover.'
    ))
    story.append(H2('Data Accuracy and Financial Insight'))
    story.append(P(
        'Paper-based records are inherently error-prone and difficult to audit. GHMS provides a single source of truth for all '
        'operational and financial data. Owners gain real-time visibility into revenue, expenses, occupancy rates, and guest '
        'demographics. Automated financial reporting simplifies tax compliance and provides the data needed to secure financing '
        'or attract investment. Historical data analytics enable trend identification and strategic planning.'
    ))
    story.append(H2('Guest Safety and Security'))
    story.append(P(
        'The police intelligence module represents a paradigm shift in guest house security. For the first time, law '
        'enforcement agencies have a digital window into guest movements across participating establishments. Suspect matching '
        'provides immediate alerts when persons of interest attempt to check in. Geofencing enables location-based monitoring, '
        'and frequent stay analysis identifies patterns that may indicate criminal reconnaissance or other suspicious behavior. '
        'This capability has no equivalent in the current Ethiopian guest house landscape.'
    ))
    story.append(H2('Regulatory Compliance'))
    story.append(P(
        'Ethiopian regulations require guest houses to maintain accurate guest registration records and make them available to '
        'authorities upon request. GHMS transforms this from a burdensome manual obligation into an automated, always-compliant '
        'digital process. Guest records are digitally stored, easily searchable, and can be securely shared with authorized '
        'agencies. This positions GHMS-subscribing guest houses as model compliant businesses, potentially reducing regulatory '
        'scrutiny and building trust with authorities.'
    ))
    story.append(H2('Revenue Growth for Guest Houses'))
    story.append(P(
        'Beyond the direct operational benefits, GHMS enables guest houses to increase their revenue. Improved occupancy '
        'management reduces empty rooms. Faster check-in and better service quality lead to higher guest satisfaction and more '
        'positive reviews. Online review integration attracts new customers. Financial analytics identify the most profitable '
        'services and room types, enabling data-driven pricing strategies. For many guest houses, the revenue gains from these '
        'improvements far exceed the modest monthly subscription cost.'
    ))
    story.extend(embed_image(FIG5, 'Figure 5: Benefits impact assessment across key operational dimensions.'))
    story.append(Spacer(1, 18))

    # ═══════════════════════════════════════════════════════════════════
    # CH 8 — Risk Assessment
    # ═══════════════════════════════════════════════════════════════════
    story.extend(H1('Risk Assessment', 8))
    story.append(P(
        'A thorough risk assessment is essential for responsible project management. The following table identifies the key '
        'risks associated with GHMS deployment, their likelihood and potential impact, and the mitigation strategies that have '
        'been developed to address each risk. These mitigations are already partially implemented or planned within the '
        'project roadmap.'
    ))

    risk_data = [
        ['Market Adoption Resistance', 'Medium', 'High',
         'On-site demonstrations, free 30-day trials, success stories from early adopters, tiered pricing to reduce barrier to entry.'],
        ['Internet Connectivity Gaps', 'Medium', 'Medium',
         'Lightweight progressive web app design, offline-capable features for core operations, data sync on reconnection.'],
        ['Telebirr Integration Complexity', 'Low', 'High',
         'Early integration development, fallback payment methods (bank transfer, cash), dedicated Telebirr API testing environment.'],
        ['Data Security Concerns', 'Low', 'High',
         'JWT authentication, encrypted data at rest and in transit, regular security audits, GDPR-inspired privacy practices, automated backups.'],
        ['Regulatory Changes', 'Low', 'Medium',
         'Active engagement with tourism and security authorities, modular compliance features, legal advisory consultation.'],
        ['Server Hardware Failure', 'Low', 'High',
         'Systemd auto-recovery, automated daily backups, disaster recovery plan, scalable cloud migration pathway if needed.'],
    ]
    story.append(Spacer(1, 12))
    rcw = [AVAIL_W * 0.22, AVAIL_W * 0.10, AVAIL_W * 0.10, AVAIL_W * 0.58]
    story.append(make_table(
        ['Risk', 'Likelihood', 'Impact', 'Mitigation Strategy'],
        risk_data,
        rcw,
    ))
    story.append(Caption('Table 4: Risk Assessment Matrix'))
    story.append(Spacer(1, 8))
    story.append(P(
        'The overall risk profile of GHMS is moderate and manageable. The most significant risk—market adoption resistance—is '
        'actively mitigated through the platform’s zero-upfront-cost model, free trial periods, and hands-on onboarding support. '
        'Technical risks are minimized by the use of proven, mature technologies and a robust deployment architecture. Security risks '
        'are addressed through industry-standard encryption, authentication, and backup practices. The company’s willingness to '
        'absorb all infrastructure and development costs significantly reduces the risk profile for both the company and its '
        'stakeholders.'
    ))
    story.append(P(
        'It is worth noting that the system is already fully developed and deployed, meaning that many of the technical risks '
        'typically associated with software projects—development delays, architecture flaws, integration failures—have already '
        'been resolved. The remaining risks are primarily related to market dynamics and operational scaling, both of which are '
        'well-understood and manageable with the strategies outlined above.'
    ))
    story.append(Spacer(1, 18))

    # ═══════════════════════════════════════════════════════════════════
    # CH 9 — Implementation Roadmap
    # ═══════════════════════════════════════════════════════════════════
    story.extend(H1('Implementation Roadmap', 9))
    story.append(P(
        'The GHMS implementation follows a three-phase roadmap designed to ensure controlled growth, quality service delivery, '
        'and sustainable scaling. Each phase builds upon the achievements of the previous one, with clear milestones and targets.'
    ))
    story.append(H2('Phase 1: Foundation and Pilot (Months 1–6)'))
    story.append(P(
        'The initial phase focuses on finalizing the production deployment, completing Telebirr payment integration, and launching '
        'a pilot program with 10 to 25 guest houses in Addis Ababa. During this phase, the team will conduct on-site onboarding visits, '
        'gather detailed user feedback, and refine the platform based on real-world usage patterns. The police intelligence module will '
        'be presented to relevant law enforcement agencies for evaluation and partnership discussion. Key metrics include pilot subscriber '
        'satisfaction scores, system uptime (target: 99.5%), and successful payment processing rates.'
    ))
    story.append(H2('Phase 2: Scaling and Optimization (Months 7–18)'))
    story.append(P(
        'With pilot lessons incorporated, Phase 2 focuses on scaling to 80 to 180 subscribers across Addis Ababa and major regional '
        'cities including Bahir Dar, Hawassa, Mekelle, and Dire Dawa. Marketing efforts will intensify through digital channels, industry '
        'partnerships, and word-of-mouth referrals from satisfied early adopters. The police intelligence module will undergo refinement '
        'based on law enforcement feedback, and advanced features such as analytics dashboards and automated reporting will be introduced. '
        'This phase targets break-even achievement and establishes GHMS as the recognized standard for digital guest house management.'
    ))
    story.append(H2('Phase 3: Full Scale and Expansion (Months 19–36)'))
    story.append(P(
        'The final phase targets 320 to 500 subscribers nationwide, with potential exploration of expansion into neighboring East African '
        'markets. Advanced analytics capabilities, AI-powered demand forecasting, and integration with online travel agencies will be '
        'developed. The subscription model may be expanded with premium add-on features. The police intelligence platform will be '
        'proposed for national-level adoption as a standard security infrastructure component for the hospitality industry.'
    ))

    # Roadmap table
    roadmap_data = [
        ['Phase 1', 'Months 1–6', '10–25', 'Final deployment, Telebirr integration, pilot launch'],
        ['Phase 2', 'Months 7–18', '80–180', 'Scale to regions, marketing, police module refinement'],
        ['Phase 3', 'Months 19–36', '320–500', 'Full scale, advanced analytics, regional expansion'],
    ]
    story.append(Spacer(1, 12))
    rcw2 = [AVAIL_W * 0.14, AVAIL_W * 0.16, AVAIL_W * 0.14, AVAIL_W * 0.56]
    story.append(make_table(
        ['Phase', 'Timeline', 'Subscribers', 'Key Activities'],
        roadmap_data,
        rcw2,
    ))
    story.append(Caption('Table 5: Implementation Roadmap Summary'))
    story.append(Spacer(1, 18))

    # ═══════════════════════════════════════════════════════════════════
    # CH 10 — Conclusion and Call to Action
    # ═══════════════════════════════════════════════════════════════════
    story.extend(H1('Conclusion and Call to Action', 10))
    story.append(P(
        'The Guest House Management System represents a transformative opportunity for Ethiopia’s hospitality sector. It is not a '
        'theoretical concept, a prototype, or a work in progress—it is a fully developed, deployed, and tested system that is ready '
        'for immediate commercial use. Every line of code has been written, every module has been tested, and the platform is currently '
        'running on a production server with a public IP address.'
    ))
    story.append(P(
        'The company has already invested in all infrastructure—the physical server, networking equipment, software development, and '
        'the police intelligence platform. This means that guest house owners can adopt GHMS with zero upfront investment, paying only a '
        'modest monthly subscription fee that is less than the cost of a single room night. The risk for stakeholders is minimal because '
        'the heavy lifting has already been done.'
    ))
    story.append(P(
        'The subscription revenue model is simple, transparent, and sustainable. At approximately 500 ETB per subscriber per month, '
        'break-even requires just 18 subscribers—a realistic target within the first 18 months of operation. Beyond break-even, every '
        'new subscriber adds directly to the platform’s financial strength, enabling continuous improvement and expansion.'
    ))
    story.append(P(
        'The benefits extend far beyond individual guest houses. The police intelligence module provides an unprecedented security '
        'capability that can enhance public safety across the country. Digital compliance transforms regulatory obligations from burdens '
        'into automated processes. Financial transparency enables better business decisions and tax compliance. And the data generated by the '
        'platform can inform policy decisions at the national level.'
    ))
    story.append(P(
        'We invite stakeholders, investors, government agencies, and law enforcement bodies to engage with us in bringing GHMS to scale. '
        'The technology is ready. The market need is clear. The financial model is sound. What remains is the collective will to modernize '
        'Ethiopia’s guest house industry and set a new standard for digital hospitality management in East Africa. Together, we can make '
        'this vision a reality.'
    ))

    return story


# ── Main ───────────────────────────────────────────────────────────────
def main():
    print('Building GHMS proposal PDF...')

    story = build_story()

    doc = TocDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=LEFT_M,
        rightMargin=RIGHT_M,
        topMargin=TOP_M,
        bottomMargin=BOT_M,
        title='GHMS Business Proposal',
        author='GHMS Team',
        subject='Guest House Management System Business Proposal',
    )
    doc.multiBuild(story)

    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f'Done: {OUTPUT_PATH} ({size_kb:.1f} KB)')


if __name__ == '__main__':
    main()
