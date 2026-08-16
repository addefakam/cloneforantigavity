import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np
import os

# Font setup
matplotlib.font_manager.fontManager.addfont('/usr/share/fonts/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf')
matplotlib.font_manager.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Noto Serif SC']
plt.rcParams['axes.unicode_minus'] = False

OUT = '/home/z/my-project/scripts/proposal_figures'
os.makedirs(OUT, exist_ok=True)

# Color palette matching DM-1 (Deep Cyan)
ACCENT = '#37DCF2'
ACCENT2 = '#1B6B7A'
WHITE = '#FFFFFF'
GRAY = '#8899AA'
DARK_TEXT = '#0A1628'
ORANGE = '#D4875A'

# ============================================================
# DIAGRAM 1: System Architecture - Police Module at Center
# ============================================================
def draw_architecture_diagram():
    fig, ax = plt.subplots(1, 1, figsize=(10, 7), facecolor='white')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')
    fig.patch.set_facecolor('white')

    # Central Police Module
    center_box = FancyBboxPatch((3.0, 2.3), 4.0, 2.4, 
                                  boxstyle="round,pad=0.15", 
                                  facecolor=ACCENT2, edgecolor=ACCENT, linewidth=2.5)
    ax.add_patch(center_box)
    ax.text(5.0, 3.9, 'POLICE MODULE', fontsize=14, fontweight='bold', 
            color=WHITE, ha='center', va='center')
    ax.text(5.0, 3.35, 'Guest Registration', fontsize=9, color='#C0E8F0', ha='center')
    ax.text(5.0, 3.0, 'Identity Verification', fontsize=9, color='#C0E8F0', ha='center')
    ax.text(5.0, 2.65, 'Real-time Monitoring', fontsize=9, color='#C0E8F0', ha='center')

    # Surrounding modules
    modules = [
        (0.5, 5.5, 'Guest Mgmt', '#2A5070'),
        (4.0, 6.0, 'Booking Engine', '#2A5070'),
        (7.5, 5.5, 'Payment Gateway', '#2A5070'),
        (0.3, 2.8, 'Staff Admin', '#2A5070'),
        (8.2, 2.8, 'Subscription Mgr', '#2A5070'),
        (0.5, 0.5, 'Room Inventory', '#2A5070'),
        (4.0, 0.0, 'Reporting Analytics', '#2A5070'),
        (7.5, 0.5, 'Notification Svc', '#2A5070'),
    ]

    for (x, y, label, color) in modules:
        box = FancyBboxPatch((x, y), 2.0, 1.1,
                              boxstyle="round,pad=0.1",
                              facecolor=color, edgecolor=ACCENT, linewidth=1.2, alpha=0.9)
        ax.add_patch(box)
        ax.text(x+1.0, y+0.55, label, fontsize=8, color=WHITE, 
                ha='center', va='center', fontweight='bold')

    # Connection arrows from each module to center
    connections = [
        (1.5, 5.5, 3.5, 4.5), (5.0, 6.0, 5.0, 4.7), (8.5, 5.5, 6.5, 4.5),
        (1.3, 3.3, 3.0, 3.5), (8.2, 3.3, 7.0, 3.5),
        (1.5, 1.0, 3.5, 2.3), (5.0, 1.1, 5.0, 2.3), (8.5, 1.0, 6.5, 2.3),
    ]
    for (x1, y1, x2, y2) in connections:
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                     arrowprops=dict(arrowstyle='->', color=ACCENT, lw=1.3, alpha=0.7))

    ax.set_title('Figure 1: GHMS Architecture - Police Module as Central Backbone',
                 fontsize=11, fontweight='bold', color=DARK_TEXT, pad=10)
    plt.tight_layout()
    plt.savefig(f'{OUT}/arch_diagram.png', dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print('Architecture diagram saved.')


# ============================================================
# DIAGRAM 2: Entity Relationship Diagram (Police Data Model)
# ============================================================
def draw_er_diagram():
    fig, ax = plt.subplots(1, 1, figsize=(11, 7), facecolor='white')
    ax.set_xlim(0, 11)
    ax.set_ylim(0, 7)
    ax.axis('off')

    def draw_entity(ax, x, y, w, h, title, fields, header_color=ACCENT2):
        header = FancyBboxPatch((x, y+h-0.7), w, 0.7,
                                 boxstyle="round,pad=0.05",
                                 facecolor=header_color, edgecolor=ACCENT, linewidth=1.5)
        ax.add_patch(header)
        ax.text(x+w/2, y+h-0.35, title, fontsize=9, fontweight='bold', 
                color=WHITE, ha='center', va='center')
        body = FancyBboxPatch((x, y), w, h-0.7,
                               boxstyle="round,pad=0.05",
                               facecolor='#F8FBFD', edgecolor='#B0D0E0', linewidth=1)
        ax.add_patch(body)
        for i, field in enumerate(fields):
            fy = y + h - 1.05 - i * 0.32
            if fy > y + 0.1:
                ax.text(x + 0.15, fy, field, fontsize=7, color=DARK_TEXT, va='center')

    draw_entity(ax, 0.2, 3.8, 2.6, 3.0, 'Guest', [
        '** id (PK)', '** nationalId', '** fullName', '** phoneNumber',
        '** dateOfBirth', '** nationality', 'photoPath', 'occupation',
        'purposeOfVisit', 'createdAt'
    ], '#1B4B6B')

    draw_entity(ax, 4.2, 4.5, 2.6, 2.3, 'PoliceRecord', [
        '** id (PK)', '** guestId (FK)', '** verificationStatus',
        '** checkedBy', '** checkDate', 'remarks', 'riskLevel'
    ])

    draw_entity(ax, 8.2, 4.2, 2.6, 2.6, 'Registration', [
        '** id (PK)', '** guestId (FK)', '** roomId (FK)',
        '** checkInDate', 'checkOutDate', 'status', 'registeredBy'
    ])

    draw_entity(ax, 4.2, 0.5, 2.6, 2.0, 'Blacklist', [
        '** id (PK)', '** nationalId', '** reason',
        '** flaggedBy', '** flaggedDate', 'isActive'
    ], '#6B1B1B')

    draw_entity(ax, 8.2, 0.5, 2.6, 2.0, 'AuditLog', [
        '** id (PK)', '** userId', '** action',
        '** entity', '** timestamp', 'ipAddress'
    ], '#4B3B1B')

    ax.annotate('', xy=(4.2, 5.5), xytext=(2.8, 5.0),
                arrowprops=dict(arrowstyle='->', color=ORANGE, lw=2))
    ax.text(3.3, 5.45, '1:N', fontsize=8, color=ORANGE, fontweight='bold')

    ax.annotate('', xy=(8.2, 5.3), xytext=(6.8, 5.5),
                arrowprops=dict(arrowstyle='->', color=ORANGE, lw=2))
    ax.text(7.2, 5.6, '1:N', fontsize=8, color=ORANGE, fontweight='bold')

    ax.annotate('', xy=(5.5, 4.5), xytext=(5.5, 2.5),
                arrowprops=dict(arrowstyle='->', color='#CC4444', lw=2))
    ax.text(5.6, 3.5, 'lookup', fontsize=7, color='#CC4444', fontstyle='italic')

    ax.annotate('', xy=(8.2, 1.5), xytext=(6.8, 1.5),
                arrowprops=dict(arrowstyle='->', color='#AA8844', lw=2))
    ax.text(7.2, 1.7, 'logs', fontsize=7, color='#AA8844', fontstyle='italic')

    ax.annotate('', xy=(2.8, 4.2), xytext=(4.2, 4.5),
                arrowprops=dict(arrowstyle='->', color=ACCENT, lw=1.5, linestyle='dashed'))
    
    ax.set_title('Figure 2: Police Module - Core Entity Relationship Diagram',
                 fontsize=11, fontweight='bold', color=DARK_TEXT, pad=10)
    plt.tight_layout()
    plt.savefig(f'{OUT}/er_diagram.png', dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print('ER diagram saved.')


# ============================================================
# DIAGRAM 3: Guest Registration & Police Verification Flow
# ============================================================
def draw_flow_diagram():
    fig, ax = plt.subplots(1, 1, figsize=(10, 8), facecolor='white')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 8)
    ax.axis('off')

    def draw_step(ax, x, y, w, h, text, color=ACCENT2, text_color=WHITE):
        box = FancyBboxPatch((x-w/2, y-h/2), w, h,
                              boxstyle="round,pad=0.12",
                              facecolor=color, edgecolor=ACCENT, linewidth=1.5)
        ax.add_patch(box)
        ax.text(x, y, text, fontsize=8, color=text_color, ha='center', va='center', fontweight='bold')

    def draw_decision(ax, x, y, size, text):
        diamond = plt.Polygon([(x, y+size), (x+size*1.4, y), (x, y-size), (x-size*1.4, y)],
                               facecolor=ORANGE, edgecolor='#B06030', linewidth=1.5)
        ax.add_patch(diamond)
        ax.text(x, y, text, fontsize=7, color=WHITE, ha='center', va='center', fontweight='bold')

    def arrow(ax, x1, y1, x2, y2, label=''):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                     arrowprops=dict(arrowstyle='->', color=ACCENT, lw=1.5))
        if label:
            mx, my = (x1+x2)/2, (y1+y2)/2
            ax.text(mx+0.15, my, label, fontsize=7, color=DARK_TEXT, fontstyle='italic')

    draw_step(ax, 5.0, 7.4, 3.0, 0.6, 'Guest Arrives at Property', '#2A5070')
    arrow(ax, 5.0, 7.1, 5.0, 6.6)
    draw_step(ax, 5.0, 6.3, 3.2, 0.6, 'Front Desk Opens Registration Form', '#2A5070')
    arrow(ax, 5.0, 6.0, 5.0, 5.5)
    draw_step(ax, 5.0, 5.2, 3.5, 0.6, 'Enter Guest Details + National ID', ACCENT2)
    arrow(ax, 5.0, 4.9, 5.0, 4.4)
    draw_step(ax, 5.0, 4.1, 3.2, 0.6, 'System Auto-checks Blacklist DB', '#6B1B2B')
    arrow(ax, 5.0, 3.8, 5.0, 3.3)
    draw_decision(ax, 5.0, 2.8, 0.4, 'On Blacklist?')
    
    # YES path
    arrow(ax, 6.4, 2.8, 7.8, 2.8, 'YES')
    draw_step(ax, 8.5, 2.8, 1.6, 0.7, 'ALERT: Deny Check-in', '#CC2222')
    
    # NO path
    arrow(ax, 5.0, 2.4, 5.0, 1.9, 'NO')
    draw_step(ax, 5.0, 1.6, 3.2, 0.6, 'Police Verification Record Created', ACCENT2)
    arrow(ax, 5.0, 1.3, 5.0, 0.8)
    draw_step(ax, 5.0, 0.5, 3.0, 0.6, 'Room Assigned - Check-in Complete', '#2A6B3A')

    # Side elements
    draw_step(ax, 8.5, 5.2, 2.2, 0.6, 'Police Dashboard Updated', '#3A3A6B')
    arrow(ax, 6.7, 5.2, 7.4, 5.2)
    draw_step(ax, 1.5, 4.1, 2.2, 0.6, 'Auto-generated Police Report', '#3A3A6B')
    arrow(ax, 3.3, 4.1, 2.7, 4.1)

    ax.set_title('Figure 3: Guest Registration & Police Verification Workflow',
                 fontsize=11, fontweight='bold', color=DARK_TEXT, pad=10)
    plt.tight_layout()
    plt.savefig(f'{OUT}/flow_diagram.png', dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print('Flow diagram saved.')


# ============================================================
# DIAGRAM 4: Real-time Monitoring Dashboard Mockup
# ============================================================
def draw_dashboard_mockup():
    fig, ax = plt.subplots(1, 1, figsize=(10, 6.5), facecolor='white')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.5)
    ax.axis('off')

    dash_bg = FancyBboxPatch((0.2, 0.2), 9.6, 6.1,
                              boxstyle="round,pad=0.15",
                              facecolor='#F0F4F8', edgecolor='#C0D0E0', linewidth=2)
    ax.add_patch(dash_bg)

    header = FancyBboxPatch((0.2, 5.8), 9.6, 0.5,
                             boxstyle="round,pad=0.05",
                             facecolor=ACCENT2, edgecolor='none')
    ax.add_patch(header)
    ax.text(5.0, 6.05, 'GHMS Police Monitoring Dashboard', fontsize=12,
            fontweight='bold', color=WHITE, ha='center')

    kpis = [
        (1.2, 4.8, 'Total Guests Today', '147', ACCENT2),
        (3.5, 4.8, 'Verified', '142', '#2A6B3A'),
        (5.8, 4.8, 'Pending Review', '3', ORANGE),
        (8.1, 4.8, 'Flagged', '2', '#CC2222'),
    ]
    for (x, y, label, value, color) in kpis:
        card = FancyBboxPatch((x-0.9, y-0.5), 1.8, 1.0,
                               boxstyle="round,pad=0.08",
                               facecolor=WHITE, edgecolor=color, linewidth=2)
        ax.add_patch(card)
        ax.text(x, y+0.15, value, fontsize=18, fontweight='bold', color=color, ha='center')
        ax.text(x, y-0.25, label, fontsize=7, color=GRAY, ha='center')

    # Mini bar chart
    chart_bg = FancyBboxPatch((0.5, 1.8), 4.2, 2.6,
                               boxstyle="round,pad=0.1",
                               facecolor=WHITE, edgecolor='#D0D8E0', linewidth=1)
    ax.add_patch(chart_bg)
    ax.text(2.6, 4.15, 'Weekly Check-ins', fontsize=9, fontweight='bold', color=DARK_TEXT, ha='center')

    days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    values = [23, 31, 28, 35, 42, 55, 48]
    bars_x = np.linspace(0.9, 4.3, 7)
    max_val = max(values)
    for i, (bx, val) in enumerate(zip(bars_x, values)):
        bar_h = (val / max_val) * 1.8
        bar = FancyBboxPatch((bx-0.2, 2.0), 0.35, bar_h,
                              boxstyle="round,pad=0.02",
                              facecolor=ACCENT, edgecolor='none', alpha=0.8)
        ax.add_patch(bar)
        ax.text(bx, 1.8, days[i], fontsize=6, color=GRAY, ha='center')

    # Recent alerts
    alert_bg = FancyBboxPatch((5.2, 1.8), 4.4, 2.6,
                               boxstyle="round,pad=0.1",
                               facecolor=WHITE, edgecolor='#D0D8E0', linewidth=1)
    ax.add_patch(alert_bg)
    ax.text(7.4, 4.15, 'Recent Alerts', fontsize=9, fontweight='bold', color=DARK_TEXT, ha='center')

    alerts = [
        ('14:32 - FLAGGED', 'Guest #1042 - ID mismatch', '#CC2222'),
        ('13:15 - PENDING', 'Guest #1038 - Awaiting verify', ORANGE),
        ('12:01 - VERIFIED', 'Guest #1035 - Approved', '#2A6B3A'),
        ('11:45 - VERIFIED', 'Guest #1034 - Approved', '#2A6B3A'),
        ('10:30 - FLAGGED', 'Guest #1029 - Blacklist hit', '#CC2222'),
    ]
    for i, (time, desc, color) in enumerate(alerts):
        y_pos = 3.7 - i * 0.38
        ax.text(5.5, y_pos, time, fontsize=6.5, color=color, fontweight='bold', va='center')
        ax.text(7.2, y_pos, desc, fontsize=6.5, color=DARK_TEXT, va='center')

    # Status bar
    status = FancyBboxPatch((0.5, 0.5), 9.0, 1.0,
                             boxstyle="round,pad=0.1",
                             facecolor=WHITE, edgecolor='#D0D8E0', linewidth=1)
    ax.add_patch(status)
    ax.text(5.0, 1.1, 'System Status: ONLINE  |  Last Sync: 2 min ago  |  Active Properties: 24  |  Database: PostgreSQL',
            fontsize=7.5, color=GRAY, ha='center', va='center')
    ax.text(5.0, 0.75, 'Real-time WebSocket Connection  |  JWT Auth Active  |  Caddy HTTPS  |  systemd Auto-Recovery',
            fontsize=7, color='#AABBCC', ha='center', va='center')

    ax.set_title('Figure 4: Police Monitoring Dashboard - Real-time Overview',
                 fontsize=11, fontweight='bold', color=DARK_TEXT, pad=10)
    plt.tight_layout()
    plt.savefig(f'{OUT}/dashboard_mockup.png', dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print('Dashboard mockup saved.')


# ============================================================
# DIAGRAM 5: Integration Points - How Police Module Connects All
# ============================================================
def draw_integration_diagram():
    fig, ax = plt.subplots(1, 1, figsize=(10, 7), facecolor='white')
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)
    ax.axis('off')

    circle = plt.Circle((5, 3.5), 1.2, facecolor=ACCENT2, edgecolor=ACCENT, linewidth=3)
    ax.add_patch(circle)
    ax.text(5, 3.7, 'POLICE', fontsize=13, fontweight='bold', color=WHITE, ha='center')
    ax.text(5, 3.25, 'MODULE', fontsize=13, fontweight='bold', color=WHITE, ha='center')

    satellites = [
        (5.0, 6.2, 'Guest Management', 'Bi-directional sync on profiles', 'top'),
        (8.5, 4.8, 'Booking Engine', 'Pre-verify booking guests', 'top-right'),
        (9.0, 2.0, 'Payment Gateway', 'Block pay for unverified', 'right'),
        (7.0, 0.5, 'Notification Service', 'Auto-alerts on flagged guests', 'bottom-right'),
        (3.0, 0.5, 'Reporting Analytics', 'Police reports from reg data', 'bottom-left'),
        (1.0, 2.0, 'Room Inventory', 'Room lock until verified', 'left'),
        (1.5, 4.8, 'Staff Admin', 'Role-based police data access', 'top-left'),
    ]

    for (x, y, label, desc, pos) in satellites:
        box = FancyBboxPatch((x-1.0, y-0.4), 2.0, 0.8,
                              boxstyle="round,pad=0.08",
                              facecolor='#2A5070', edgecolor=ACCENT, linewidth=1.2)
        ax.add_patch(box)
        ax.text(x, y+0.05, label, fontsize=8, color=WHITE, ha='center', va='center', fontweight='bold')
        
        ax.annotate('', xy=(x, y-0.4 if y > 3.5 else y+0.4), 
                     xytext=(5, 3.5 + (y-3.5)*0.34),
                     arrowprops=dict(arrowstyle='<->', color=ACCENT, lw=1.5, alpha=0.6))
        
        mx = (x + 5) / 2
        my = (y + 3.5) / 2
        if 'top' in pos:
            my = my + 0.25
        elif 'bottom' in pos:
            my = my - 0.25
        elif 'right' in pos:
            mx = mx + 0.3
        elif 'left' in pos:
            mx = mx - 0.3
        
        ax.text(mx, my, desc, fontsize=6, color=DARK_TEXT, 
                ha='center', va='center', fontstyle='italic',
                bbox=dict(boxstyle='round,pad=0.2', facecolor='white', edgecolor='none', alpha=0.8))

    ax.set_title('Figure 5: Police Module Integration Points - Connecting Every Subsystem',
                 fontsize=11, fontweight='bold', color=DARK_TEXT, pad=10)
    plt.tight_layout()
    plt.savefig(f'{OUT}/integration_diagram.png', dpi=200, bbox_inches='tight', facecolor='white', edgecolor='none')
    plt.close()
    print('Integration diagram saved.')


if __name__ == '__main__':
    draw_architecture_diagram()
    draw_er_diagram()
    draw_flow_diagram()
    draw_dashboard_mockup()
    draw_integration_diagram()
    print('All 5 diagrams generated successfully!')
