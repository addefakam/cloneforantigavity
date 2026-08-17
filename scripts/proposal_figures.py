#!/usr/bin/env python3
"""Generate high-quality 300 DPI figures for GHMS Business Proposal."""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np
import os

fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['SarasaMonoSC', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

OUT_DIR = '/home/z/my-project/scripts/proposal_figures'
os.makedirs(OUT_DIR, exist_ok=True)

C_PRIMARY = '#4d6571'
C_ACCENT = '#3a90bb'
C_ACCENT2 = '#49ba49'
C_MUTED = '#72797c'
PALETTE = ['#3a90bb', '#49ba49', '#f0a030', '#e05050', '#8c6bbf', '#50b0b0', '#c06090', '#708040']

def style_ax(ax, title='', xlabel='', ylabel=''):
    ax.set_facecolor('#fafafa')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#cccccc')
    ax.spines['bottom'].set_color('#cccccc')
    ax.tick_params(colors='#555555', labelsize=9)
    if title:
        ax.set_title(title, fontsize=13, fontweight='bold', color=C_PRIMARY, pad=12)
    if xlabel:
        ax.set_xlabel(xlabel, fontsize=10, color=C_MUTED)
    if ylabel:
        ax.set_ylabel(ylabel, fontsize=10, color=C_MUTED)

def fig1_problem():
    fig, ax = plt.subplots(figsize=(7, 3.8))
    cats = ['Guest Reg.', 'Room Mgmt.', 'Reservations', 'Finance', 'Police Rpt.', 'Security']
    manual = [2.8, 2.5, 3.0, 2.3, 1.5, 1.8]
    digital = [8.5, 8.8, 8.3, 8.0, 7.5, 7.8]
    x = np.arange(len(cats))
    w = 0.32
    b1 = ax.bar(x - w/2, manual, w, label='Current Manual Process', color='#d4a0a0', edgecolor='#b07070', linewidth=0.8)
    b2 = ax.bar(x + w/2, digital, w, label='With GHMS (Expected)', color='#7bb8d4', edgecolor='#4a90b0', linewidth=0.8)
    ax.set_xticks(x)
    ax.set_xticklabels(cats, fontsize=8.5)
    ax.set_ylabel('Effectiveness Score (1-10)', fontsize=10, color=C_MUTED)
    ax.set_ylim(0, 10.5)
    ax.legend(loc='upper right', fontsize=9, framealpha=0.9)
    style_ax(ax, 'Current Manual vs. Digital GHMS Effectiveness')
    for bar in b1:
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.2, f'{bar.get_height():.1f}', ha='center', va='bottom', fontsize=7.5, color='#8b5050')
    for bar in b2:
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.2, f'{bar.get_height():.1f}', ha='center', va='bottom', fontsize=7.5, color='#3a6a8a')
    plt.tight_layout(pad=1.2)
    fig.savefig(f'{OUT_DIR}/fig1_problem.png', dpi=300, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    print('  fig1_problem.png done')

def fig2_revenue():
    fig, ax1 = plt.subplots(figsize=(7, 4.0))
    years = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5']
    subs = [25, 80, 180, 320, 500]
    ax1.bar(years, [s*500*12 for s in subs], color=C_ACCENT, edgecolor='#2a7090', linewidth=0.8, alpha=0.85, label='Annual Gross Revenue (ETB)')
    ax1.set_ylabel('Revenue (ETB)', fontsize=10, color=C_MUTED)
    ax2 = ax1.twinx()
    ax2.plot(years, subs, 'o-', color=C_ACCENT2, linewidth=2.5, markersize=8, label='Active Subscribers', zorder=5)
    ax2.set_ylabel('Number of Subscribers', fontsize=10, color=C_ACCENT2)
    ax2.spines['right'].set_color(C_ACCENT2)
    ax2.spines['top'].set_visible(False)
    ax2.tick_params(axis='y', colors=C_ACCENT2)
    for i, v in enumerate(subs):
        ax2.annotate(str(v), (years[i], v), textcoords="offset points", xytext=(0, 12), ha='center', fontsize=9, fontweight='bold', color=C_ACCENT2)
    l1, lb1 = ax1.get_legend_handles_labels()
    l2, lb2 = ax2.get_legend_handles_labels()
    ax1.legend(l1 + l2, lb1 + lb2, loc='upper left', fontsize=9, framealpha=0.9)
    style_ax(ax1, 'Five-Year Revenue Projection')
    plt.tight_layout(pad=1.2)
    fig.savefig(f'{OUT_DIR}/fig2_revenue.png', dpi=300, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    print('  fig2_revenue.png done')

def fig3_breakeven():
    fig, ax = plt.subplots(figsize=(7, 4.0))
    months = np.arange(1, 49)
    monthly_invest = 8639  # hosting 4472 + amortized dev 4167
    cum_cost = np.cumsum(np.full(48, monthly_invest))
    s = 0
    subs = []
    for m in months:
        if m <= 6: s += 4
        elif m <= 18: s += 5
        elif m <= 30: s += 9
        elif m <= 42: s += 12
        else: s += 15
        subs.append(s)
    subs = np.array(subs)
    monthly_rev = subs * 500
    cum_rev = np.cumsum(monthly_rev)
    diff = cum_rev - cum_cost
    be_idx = np.where(diff >= 0)[0]
    be_m = be_idx[0] + 1 if len(be_idx) > 0 else 60
    ax.plot(months, cum_cost/1000, color='#d05050', linewidth=2.5, label='Cumulative Investment (ETB K)')
    ax.plot(months, cum_rev/1000, color=C_ACCENT2, linewidth=2.5, label='Cumulative Revenue (ETB K)')
    if be_m <= 48:
        ax.axvline(x=be_m, color=C_MUTED, linestyle='--', linewidth=1.2, alpha=0.7)
        ax.annotate(f'Break-Even\nMonth {be_m}', xy=(be_m, cum_cost[be_m-1]/1000), xytext=(be_m+5, cum_cost[be_m-1]/1000+200), fontsize=9, fontweight='bold', color=C_PRIMARY, arrowprops=dict(arrowstyle='->', color=C_PRIMARY, lw=1.5))
    ax.fill_between(months, cum_cost/1000, cum_rev/1000, where=(cum_rev >= cum_cost), alpha=0.1, color=C_ACCENT2)
    ax.fill_between(months, cum_cost/1000, cum_rev/1000, where=(cum_rev < cum_cost), alpha=0.1, color='#d05050')
    ax.set_xlabel('Months After Launch', fontsize=10, color=C_MUTED)
    ax.set_ylabel('Amount (ETB Thousands)', fontsize=10, color=C_MUTED)
    ax.legend(loc='upper left', fontsize=9, framealpha=0.9)
    style_ax(ax, 'Break-Even Analysis')
    plt.tight_layout(pad=1.2)
    fig.savefig(f'{OUT_DIR}/fig3_breakeven.png', dpi=300, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    print('  fig3_breakeven.png done')

def fig4_arch():
    fig, ax = plt.subplots(figsize=(7, 5))
    ax.set_xlim(0, 10); ax.set_ylim(0, 10); ax.axis('off')
    def box(x, y, w, h, label, color, fs=9, bold=False):
        rect = plt.Rectangle((x,y), w, h, linewidth=1.5, edgecolor=color, facecolor=color, alpha=0.12, zorder=2)
        ax.add_patch(rect)
        rect2 = plt.Rectangle((x,y), w, h, linewidth=1.5, edgecolor=color, facecolor='none', zorder=3)
        ax.add_patch(rect2)
        wt = 'bold' if bold else 'normal'
        ax.text(x+w/2, y+h/2, label, ha='center', va='center', fontsize=fs, fontweight=wt, color='#333333', zorder=4)
    def arrow(x1,y1,x2,y2):
        ax.annotate('', xy=(x2,y2), xytext=(x1,y1), arrowprops=dict(arrowstyle='->', color='#aaaaaa', lw=1.3))
    ax.text(5, 9.6, 'GHMS System Architecture', ha='center', fontsize=14, fontweight='bold', color=C_PRIMARY)
    ax.text(5, 9.1, 'USER LAYER', ha='center', fontsize=8, color=C_MUTED, style='italic')
    box(0.5, 8.2, 2.5, 0.7, 'Guest House Owners', '#3a90bb')
    box(3.75, 8.2, 2.5, 0.7, 'Staff / Receptionists', '#3a90bb')
    box(7.0, 8.2, 2.5, 0.7, 'Police / Law Enforcement', '#e08050')
    for xc in [1.75, 5.0, 8.25]:
        arrow(xc, 8.2, 5, 7.5)
    ax.text(5, 7.7, 'PLATFORM LAYER  (Next.js 16 + React 19)', ha='center', fontsize=8, color=C_MUTED, style='italic')
    box(0.3, 6.3, 2.0, 0.9, 'Dashboard', '#49ba49', 8)
    box(2.6, 6.3, 2.0, 0.9, 'Reservations', '#49ba49', 8)
    box(4.9, 6.3, 2.0, 0.9, 'Guest Registry', '#49ba49', 8)
    box(7.2, 6.3, 2.5, 0.9, 'Police Intelligence', '#e08050', 8)
    box(0.3, 5.1, 2.0, 0.9, 'Room Mgmt.', '#49ba49', 8)
    box(2.6, 5.1, 2.0, 0.9, 'Payments', '#f0a030', 8)
    box(4.9, 5.1, 2.0, 0.9, 'Expenses', '#49ba49', 8)
    box(7.2, 5.1, 2.5, 0.9, 'Suspect Alerts', '#e08050', 8)
    arrow(5, 5.1, 5, 4.5)
    ax.text(5, 4.8, 'DATA LAYER', ha='center', fontsize=8, color=C_MUTED, style='italic')
    box(0.5, 3.6, 4.0, 0.7, 'PostgreSQL Database (21 Models)', '#4d6571', 10, bold=True)
    box(5.0, 3.6, 4.5, 0.7, 'Prisma ORM + Auto-Migration', '#4d6571', 10, bold=True)
    arrow(5, 3.6, 5, 3.0)
    ax.text(5, 3.3, 'INFRASTRUCTURE LAYER', ha='center', fontsize=8, color=C_MUTED, style='italic')
    box(0.5, 2.0, 2.5, 0.7, 'Caddy (SSL)', '#72797c', 9)
    box(3.5, 2.0, 2.5, 0.7, 'Systemd Recovery', '#72797c', 9)
    box(6.5, 2.0, 3.0, 0.7, 'Ubuntu Server (8GB)', '#72797c', 9)
    ax.text(5, 1.5, 'EXTERNAL INTEGRATIONS', ha='center', fontsize=8, color=C_MUTED, style='italic')
    box(0.5, 0.5, 2.2, 0.7, 'Telebirr', '#f0a030', 8.5)
    box(3.2, 0.5, 2.2, 0.7, 'Ethio Telecom', '#f0a030', 8.5)
    box(5.9, 0.5, 2.0, 0.7, 'SMS / Email', '#f0a030', 8.5)
    box(8.4, 0.5, 1.4, 0.7, 'DNS', '#f0a030', 8.5)
    plt.tight_layout(pad=0.5)
    fig.savefig(f'{OUT_DIR}/fig4_architecture.png', dpi=300, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    print('  fig4_architecture.png done')

def fig5_benefits():
    fig, ax = plt.subplots(figsize=(7, 4.0))
    cats = ['Operational Efficiency', 'Data Accuracy', 'Guest Safety', 'Revenue Growth', 'Compliance', 'Law Enforcement']
    before = [30, 35, 25, 20, 15, 20]
    after = [85, 92, 88, 65, 90, 82]
    imp = [a - b for a, b in zip(after, before)]
    y = np.arange(len(cats))
    ax.barh(y + 0.18, before, 0.34, label='Before GHMS (%)', color='#d4a0a0', edgecolor='#b07070', linewidth=0.8)
    ax.barh(y - 0.18, after, 0.34, label='After GHMS (%)', color='#7bb8d4', edgecolor='#4a90b0', linewidth=0.8)
    for i, v in enumerate(imp):
        ax.text(after[i] + 1.5, y[i] - 0.18, f'+{v}%', va='center', fontsize=9, fontweight='bold', color='#2a6a4a')
    ax.set_yticks(y)
    ax.set_yticklabels(cats, fontsize=9)
    ax.set_xlabel('Performance Level (%)', fontsize=10, color=C_MUTED)
    ax.set_xlim(0, 105)
    ax.legend(loc='lower right', fontsize=9, framealpha=0.9)
    style_ax(ax, 'Expected Impact of GHMS Implementation')
    plt.tight_layout(pad=1.2)
    fig.savefig(f'{OUT_DIR}/fig5_benefits.png', dpi=300, bbox_inches='tight', facecolor='white')
    plt.close(fig)
    print('  fig5_benefits.png done')

if __name__ == '__main__':
    print('Generating proposal figures...')
    fig1_problem(); fig2_revenue(); fig3_breakeven(); fig4_arch(); fig5_benefits()
    print(f'All figures saved to {OUT_DIR}/')
