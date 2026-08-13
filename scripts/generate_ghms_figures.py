# -*- coding: utf-8 -*-
"""
Generate high-quality figures for GHMS Proposal.
All images: 300 DPI, professional styling with cascade palette.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.patheffects as pe
import numpy as np
import os

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONFIG
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DPI = 300
OUT_DIR = '/home/z/my-project/scripts/ghms_figures'
os.makedirs(OUT_DIR, exist_ok=True)

# Cascade palette
PRIMARY = '#32454e'
ACCENT = '#1f6c92'
MUTED = '#747b7e'
BG = '#f4f5f5'
TEXT = '#131515'
BORDER = '#acbdc5'
SUCCESS = '#529067'
WARNING = '#8c7443'
ERROR = '#a25b54'
INFO = '#507aa4'
LIGHT_ACCENT = '#d4e8f2'
LIGHT_BG = '#e8eaeb'
WHITE = '#ffffff'

# Font setup
import matplotlib.font_manager as fm
fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Bold.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')

plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Sarasa Mono SC']
plt.rcParams['axes.unicode_minus'] = False

W_INCHES = 7.5  # A4 width minus margins


def styled_box(ax, x, y, w, h, text, facecolor=WHITE, edgecolor=BORDER,
                fontsize=9, fontweight='normal', textcolor=TEXT, alpha=1.0,
                linewidth=1.2, boxstyle='round,pad=0.4', zorder=2,
                ha='center', va='center'):
    """Draw a styled rounded box with centered text."""
    box = FancyBboxPatch(
        (x - w/2, y - h/2), w, h,
        boxstyle=boxstyle,
        facecolor=facecolor, edgecolor=edgecolor,
        linewidth=linewidth, alpha=alpha, zorder=zorder
    )
    ax.add_patch(box)
    ax.text(x, y, text, ha=ha, va=va, fontsize=fontsize,
            fontweight=fontweight, color=textcolor, zorder=zorder+1,
            wrap=True)


def arrow(ax, x1, y1, x2, y2, color=MUTED, lw=1.5, style='->', zorder=1):
    """Draw a styled arrow."""
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle=style, color=color, lw=lw),
                zorder=zorder)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FIGURE 1: Old Manual System vs New Digital GHMS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def fig1_comparison():
    fig, axes = plt.subplots(1, 2, figsize=(W_INCHES, 3.8), constrained_layout=True)
    fig.patch.set_facecolor(WHITE)

    # Left: Old Manual System
    ax = axes[0]
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.set_facecolor('#faf5f0')
    ax.set_title('Old Manual System', fontsize=14, fontweight='bold', color=ERROR, pad=12)
    ax.axis('off')

    manual_items = [
        (5, 8.8, 'Paper Ledgers & Binders', '#f0d4cf'),
        (5, 7.2, 'Whiteboard Room Tracking', '#f0d4cf'),
        (5, 5.6, 'Verbal Communication', '#f0d4cf'),
        (5, 4.0, 'Manual Cash Recording', '#f0d4cf'),
        (5, 2.4, 'No Police Integration', '#f0d4cf'),
        (5, 0.8, 'Physical File Search', '#f0d4cf'),
    ]
    for x, y, text, fc in manual_items:
        styled_box(ax, x, y, 8, 1.0, text, facecolor=fc, edgecolor=ERROR,
                   fontsize=9.5, textcolor=ERROR, linewidth=1.0)

    # Cross marks
    for x, y, _, _ in manual_items:
        ax.text(x + 3.5, y, '\u2717', fontsize=16, color=ERROR, ha='center', va='center',
                fontweight='bold', alpha=0.7)

    # Right: New Digital GHMS
    ax = axes[1]
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.set_facecolor('#f0f6fa')
    ax.set_title('New Digital GHMS', fontsize=14, fontweight='bold', color=ACCENT, pad=12)
    ax.axis('off')

    digital_items = [
        (5, 8.8, 'Digital Room Inventory', LIGHT_ACCENT),
        (5, 7.2, 'Online Reservation System', LIGHT_ACCENT),
        (5, 5.6, 'Automated Notifications', LIGHT_ACCENT),
        (5, 4.0, 'Real-Time Financial Reports', LIGHT_ACCENT),
        (5, 2.4, 'Police Intelligence Portal', LIGHT_ACCENT),
        (5, 0.8, 'Instant Cross-Provider Search', LIGHT_ACCENT),
    ]
    for x, y, text, fc in digital_items:
        styled_box(ax, x, y, 8, 1.0, text, facecolor=fc, edgecolor=ACCENT,
                   fontsize=9.5, textcolor=PRIMARY, linewidth=1.0)

    # Check marks
    for x, y, _, _ in digital_items:
        ax.text(x + 3.5, y, '\u2713', fontsize=16, color=SUCCESS, ha='center', va='center',
                fontweight='bold', alpha=0.8)

    # Center arrow
    fig.patches.append(FancyArrowPatch(
        (0.48, 0.5), (0.52, 0.5), transform=fig.transFigure,
        arrowstyle='->', mutation_scale=25, color=ACCENT, lw=2.5
    ))

    path = os.path.join(OUT_DIR, 'fig1_comparison.png')
    fig.savefig(path, dpi=DPI, bbox_inches='tight', facecolor=WHITE)
    plt.close(fig)
    print(f'Saved: {path}')


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FIGURE 2: GHMS System Architecture Overview
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def fig2_architecture():
    fig, ax = plt.subplots(figsize=(W_INCHES, 5.0), constrained_layout=True)
    fig.patch.set_facecolor(WHITE)
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 10)
    ax.set_facecolor(WHITE)
    ax.axis('off')
    ax.set_title('GHMS System Architecture Overview', fontsize=14, fontweight='bold',
                 color=PRIMARY, pad=12)

    # Layer 1: Users (top)
    users = ['Guest House\nOperator', 'Front Desk\nStaff', 'Police\nOfficer', 'System\nAdmin']
    for i, u in enumerate(users):
        x = 2.5 + i * 3.3
        styled_box(ax, x, 9.0, 2.6, 1.2, u, facecolor=LIGHT_ACCENT, edgecolor=ACCENT,
                   fontsize=8.5, fontweight='bold', textcolor=ACCENT)

    # Arrow down
    for i in range(4):
        x = 2.5 + i * 3.3
        arrow(ax, x, 8.35, x, 7.65, color=MUTED, lw=1.2)

    # Layer 2: Presentation Layer
    styled_box(ax, 8, 7.1, 13.5, 0.9, 'Presentation Layer  \u2014  Next.js 16 (App Router) + React 19 + shadcn/ui + Tailwind CSS',
               facecolor='#e8f0f4', edgecolor=INFO, fontsize=9, fontweight='bold', textcolor=PRIMARY)

    arrow(ax, 8, 6.6, 8, 6.15, color=MUTED, lw=1.5)

    # Layer 3: API Layer
    styled_box(ax, 8, 5.65, 13.5, 0.9, 'API Layer  \u2014  50+ RESTful Endpoints  |  JWT Authentication  |  Role-Based Access Control',
               facecolor='#e8f0f4', edgecolor=INFO, fontsize=9, fontweight='bold', textcolor=PRIMARY)

    arrow(ax, 8, 5.15, 8, 4.7, color=MUTED, lw=1.5)

    # Layer 4: Business Logic Modules
    modules = ['Guest House\nOperations', 'Financial\nManagement', 'Operations &\nResources',
               'Law Enforcement\n& Security', 'Platform\nAdministration']
    mod_colors = [ACCENT, INFO, SUCCESS, ERROR, WARNING]
    for i, (m, mc) in enumerate(zip(modules, mod_colors)):
        x = 1.8 + i * 3.1
        styled_box(ax, x, 4.0, 2.7, 1.2, m, facecolor=WHITE, edgecolor=mc,
                   fontsize=8, fontweight='bold', textcolor=mc, linewidth=1.5)

    arrow(ax, 8, 3.35, 8, 2.85, color=MUTED, lw=1.5)

    # Layer 5: Data Layer
    styled_box(ax, 8, 2.35, 13.5, 0.9, 'Data Layer  \u2014  Prisma 6 ORM  |  PostgreSQL (Multi-Tenant Isolation)  |  Audit Logging',
               facecolor='#e8f0f4', edgecolor=INFO, fontsize=9, fontweight='bold', textcolor=PRIMARY)

    arrow(ax, 8, 1.85, 8, 1.35, color=MUTED, lw=1.5)

    # Layer 6: Infrastructure
    styled_box(ax, 8, 0.85, 13.5, 0.9, 'Infrastructure  \u2014  Vercel Cloud Hosting  |  CDN  |  Auto-Scaling  |  S3/Blob Storage',
               facecolor=LIGHT_BG, edgecolor=MUTED, fontsize=9, fontweight='bold', textcolor=PRIMARY)

    # Vertical separators on left
    ax.text(0.3, 9.0, 'USERS', fontsize=7, fontweight='bold', color=MUTED, rotation=90, va='center')
    ax.text(0.3, 7.1, 'FRONTEND', fontsize=7, fontweight='bold', color=MUTED, rotation=90, va='center')
    ax.text(0.3, 5.65, 'BACKEND', fontsize=7, fontweight='bold', color=MUTED, rotation=90, va='center')
    ax.text(0.3, 4.0, 'MODULES', fontsize=7, fontweight='bold', color=MUTED, rotation=90, va='center')
    ax.text(0.3, 2.35, 'DATA', fontsize=7, fontweight='bold', color=MUTED, rotation=90, va='center')
    ax.text(0.3, 0.85, 'INFRA', fontsize=7, fontweight='bold', color=MUTED, rotation=90, va='center')

    path = os.path.join(OUT_DIR, 'fig2_architecture.png')
    fig.savefig(path, dpi=DPI, bbox_inches='tight', facecolor=WHITE)
    plt.close(fig)
    print(f'Saved: {path}')


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FIGURE 3: Module Interaction Diagram
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def fig3_modules():
    fig, ax = plt.subplots(figsize=(W_INCHES, 4.2), constrained_layout=True)
    fig.patch.set_facecolor(WHITE)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8)
    ax.set_facecolor(WHITE)
    ax.axis('off')
    ax.set_title('GHMS Module Interaction Map', fontsize=14, fontweight='bold',
                 color=PRIMARY, pad=12)

    # Central hub
    styled_box(ax, 7, 4, 2.4, 1.2, 'Multi-Tenant\nData Core', facecolor=ACCENT, edgecolor=ACCENT,
               fontsize=9.5, fontweight='bold', textcolor=WHITE, linewidth=2, zorder=5)

    # Surrounding modules
    positions = [
        (2.2, 6.5, 'Guest House\nOperations'),
        (7, 7.0, 'Financial\nManagement'),
        (11.8, 6.5, 'Operations &\nResources'),
        (11.8, 1.5, 'Platform\nAdministration'),
        (7, 1.0, 'Law Enforcement\n& Security'),
        (2.2, 1.5, 'Subscription\nBilling'),
    ]
    mod_colors = [ACCENT, INFO, SUCCESS, WARNING, ERROR, MUTED]

    for (x, y, label), mc in zip(positions, mod_colors):
        styled_box(ax, x, y, 2.8, 1.0, label, facecolor=WHITE, edgecolor=mc,
                   fontsize=8.5, fontweight='bold', textcolor=mc, linewidth=1.5)
        # Arrow to center
        ax.annotate('', xy=(7, 4), xytext=(x, y),
                    arrowprops=dict(arrowstyle='<->', color=mc, lw=1.3, alpha=0.6,
                                    connectionstyle='arc3,rad=0.1'),
                    zorder=1)

    path = os.path.join(OUT_DIR, 'fig3_modules.png')
    fig.savefig(path, dpi=DPI, bbox_inches='tight', facecolor=WHITE)
    plt.close(fig)
    print(f'Saved: {path}')


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FIGURE 4: Anomaly Detection Engine
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def fig4_anomaly():
    fig, ax = plt.subplots(figsize=(W_INCHES, 4.5), constrained_layout=True)
    fig.patch.set_facecolor(WHITE)
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8)
    ax.set_facecolor(WHITE)
    ax.axis('off')
    ax.set_title('Anomaly Detection Engine \u2014 Seven Detection Types', fontsize=13, fontweight='bold',
                 color=PRIMARY, pad=12)

    # Input
    styled_box(ax, 2, 6.8, 3.2, 0.9, 'Guest Registration\n/ Reservation Event',
               facecolor=LIGHT_ACCENT, edgecolor=ACCENT, fontsize=9, fontweight='bold', textcolor=ACCENT)
    arrow(ax, 3.6, 6.3, 3.6, 5.7, color=ACCENT, lw=1.5)

    # Engine box
    styled_box(ax, 7, 5.0, 10, 1.2, 'Anomaly Detection Engine',
               facecolor=PRIMARY, edgecolor=PRIMARY, fontsize=12, fontweight='bold', textcolor=WHITE,
               linewidth=2)

    # 7 anomaly types below
    types = [
        ('Identity\nMismatch', 30, WARNING),
        ('Rapid Multi-\nProvider', 35, ERROR),
        ('No-Show\nPattern', 15, SUCCESS),
        ('Cash\nAnomaly', 25, INFO),
        ('Cross-Provider\nID', 40, ERROR),
        ('Short-Stay\nPattern', 25, INFO),
        ('Fake ID\nPattern', 45, ERROR),
    ]
    for i, (label, score, color) in enumerate(types):
        x = 1.3 + i * 1.8
        styled_box(ax, x, 3.2, 1.5, 1.1, label, facecolor=WHITE, edgecolor=color,
                   fontsize=7, fontweight='bold', textcolor=color, linewidth=1.2)
        arrow(ax, x, 4.35, x, 3.8, color=color, lw=1.0)
        # Score badge
        ax.text(x, 2.35, f'{score}+', fontsize=7.5, ha='center', va='center',
                fontweight='bold', color=color,
                bbox=dict(boxstyle='round,pad=0.2', facecolor=WHITE, edgecolor=color, linewidth=0.8))

    # Output
    ax.text(7, 1.3, 'Risk Scored Alerts  \u2192  Police Dashboard  \u2192  Investigation Workflow',
            fontsize=10, ha='center', va='center', fontweight='bold', color=ACCENT,
            bbox=dict(boxstyle='round,pad=0.4', facecolor=LIGHT_ACCENT, edgecolor=ACCENT, linewidth=1.2))

    path = os.path.join(OUT_DIR, 'fig4_anomaly.png')
    fig.savefig(path, dpi=DPI, bbox_inches='tight', facecolor=WHITE)
    plt.close(fig)
    print(f'Saved: {path}')


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FIGURE 5: Benefits Impact Overview
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
def fig5_benefits():
    fig, axes = plt.subplots(1, 3, figsize=(W_INCHES, 3.8))
    fig.patch.set_facecolor(WHITE)
    plt.subplots_adjust(wspace=0.3, left=0.02, right=0.98, top=0.88, bottom=0.05)

    # Operators
    ax = axes[0]
    ax.set_facecolor(WHITE)
    ax.axis('off')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.set_title('Guest House Operators', fontsize=11, fontweight='bold', color=ACCENT, pad=10)
    benefits_ops = ['Revenue Recovery\n8-15%', 'Admin Time Saved\n40-60%', 'Profit Increase\n15-25%']
    colors_ops = [SUCCESS, ACCENT, INFO]
    for i, (b, c) in enumerate(zip(benefits_ops, colors_ops)):
        y = 7.5 - i * 2.5
        styled_box(ax, 5, y, 8.5, 1.8, b, facecolor=WHITE, edgecolor=c,
                   fontsize=10, fontweight='bold', textcolor=c, linewidth=1.5)

    # Law Enforcement
    ax = axes[1]
    ax.set_facecolor(WHITE)
    ax.axis('off')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.set_title('Law Enforcement', fontsize=11, fontweight='bold', color=ERROR, pad=10)
    benefits_le = ['Search Time\nDays to Seconds', '7 Anomaly Types\nAuto-Detected', 'Full Audit Trail\nAccountability']
    colors_le = [ERROR, WARNING, INFO]
    for i, (b, c) in enumerate(zip(benefits_le, colors_le)):
        y = 7.5 - i * 2.5
        styled_box(ax, 5, y, 8.5, 1.8, b, facecolor=WHITE, edgecolor=c,
                   fontsize=10, fontweight='bold', textcolor=c, linewidth=1.5)

    # Government
    ax = axes[2]
    ax.set_facecolor(WHITE)
    ax.axis('off')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.set_title('Government', fontsize=11, fontweight='bold', color=WARNING, pad=10)
    benefits_gov = ['100% Digital\nCompliance', 'Real-Time Sector\nAnalytics', 'Sustainable Revenue\nModel']
    colors_gov = [WARNING, ACCENT, SUCCESS]
    for i, (b, c) in enumerate(zip(benefits_gov, colors_gov)):
        y = 7.5 - i * 2.5
        styled_box(ax, 5, y, 8.5, 1.8, b, facecolor=WHITE, edgecolor=c,
                   fontsize=10, fontweight='bold', textcolor=c, linewidth=1.5)

    path = os.path.join(OUT_DIR, 'fig5_benefits.png')
    fig.savefig(path, dpi=DPI, bbox_inches='tight', facecolor=WHITE)
    plt.close(fig)
    print(f'Saved: {path}')


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# RUN ALL
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if __name__ == '__main__':
    print('Generating GHMS proposal figures at %d DPI...' % DPI)
    fig1_comparison()
    fig2_architecture()
    fig3_modules()
    fig4_anomaly()
    fig5_benefits()
    print('\nAll figures generated successfully!')
    print(f'Output directory: {OUT_DIR}')
