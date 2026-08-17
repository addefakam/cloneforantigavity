const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  PageBreak, TableOfContents, SectionType, LevelFormat,
} = require('docx');
const fs = require('fs');

// ============================================================
// PALETTE: DM-1 Deep Cyan (Tech / AI / Digital Transformation)
// ============================================================
const P = {
  bg: '162235', primary: 'FFFFFF', accent: '37DCF2',
  titleColor: 'FFFFFF', subtitleColor: 'B0B8C0',
  metaColor: '90989F', footerColor: '687078',
};
const T = {
  headerBg: '1B6B7A', headerText: 'FFFFFF',
  accentLine: '1B6B7A', innerLine: 'C8DDE2', surface: 'EDF3F5',
};
const c = (hex) => hex.replace('#', '');

// ============================================================
// BORDERS & HELPERS
// ============================================================
const NB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const emptyPara = () => new Paragraph({ spacing: { before: 0, after: 0 }, children: [] });

function safeText(value, placeholder) {
  if (value === undefined || value === null || value === '') return placeholder || 'N/A';
  return String(value);
}

// ============================================================
// COVER RECIPE R4: Top Color Block (proposal)
// ============================================================
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 20;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt;
  let lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    const cpl = charsPerLine(minPt);
    lines = splitTitleLines(title, cpl);
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([' ', '-', '_', '/', ':', '(', ')', ',', '.']);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop(); lines[lines.length - 1] += ' ' + last;
  }
  return lines;
}

function buildCoverR4(config) {
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 26);
  const titleSize = titlePt * 2;
  const titleBlockHeight = titleLines.length * (titlePt * 23 + 200);
  const englishLabelH = config.englishLabel ? (9 * 23 + 500) : 0;
  const subtitleH = config.subtitle ? (12 * 23 + 200) : 0;
  const upperContentH = englishLabelH + titleBlockHeight + subtitleH;
  const UPPER_MIN = 7500;
  const UPPER_H = Math.max(UPPER_MIN, upperContentH + 1500 + 800);
  const DIVIDER_H = 60;
  const contentEstimate = (config.englishLabel ? (9 * 23 + 500) : 0) +
    titleLines.length * (titlePt * 23 + 200) + (config.subtitle ? (12 * 23 + 200) : 0);
  const spacerIntrinsic = 280;
  const topSpacing = Math.max(UPPER_H - contentEstimate - spacerIntrinsic - 800, 400);

  const upperBlock = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: { type: 'FIXED' },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: UPPER_H, rule: 'exact' },
      children: [new TableCell({
        shading: { fill: c(P.bg) }, borders: noBorders, verticalAlign: 'top',
        margins: { left: padL, right: padR },
        children: [
          new Paragraph({ spacing: { before: topSpacing } }),
          config.englishLabel ? new Paragraph({
            spacing: { after: 500 },
            children: [new TextRun({ text: config.englishLabel.split('').join(' '),
              size: 18, color: c(P.accent), font: { ascii: 'Calibri' }, characterSpacing: 60 })],
          }) : null,
          ...titleLines.map((line, i) => new Paragraph({
            spacing: { after: i < titleLines.length - 1 ? 100 : 200,
                       line: Math.ceil(titlePt * 23), lineRule: 'atLeast' },
            children: [new TextRun({ text: line, size: titleSize, bold: true,
              color: c(P.titleColor), font: { eastAsia: 'SimHei', ascii: 'Arial' } })],
          })),
          config.subtitle ? new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: config.subtitle, size: 24, color: c(P.subtitleColor),
              font: { eastAsia: 'Microsoft YaHei', ascii: 'Arial' } })],
          }) : null,
        ].filter(Boolean),
      })],
    })],
  });

  const divider = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: DIVIDER_H, rule: 'exact' },
      children: [new TableCell({ borders: noBorders,
        shading: { fill: c(P.accent) }, children: [emptyPara()] })],
    })],
  });

  const lowerContent = [
    new Paragraph({ spacing: { before: 800 } }),
    ...(config.metaLines || []).map(line => new Paragraph({
      indent: { left: padL }, spacing: { after: 100 },
      children: [new TextRun({ text: line, size: 28, color: c(P.metaColor),
        font: { eastAsia: 'Microsoft YaHei', ascii: 'Arial' } })],
    })),
    new Paragraph({ spacing: { before: 2000 } }),
    new Paragraph({
      indent: { left: padL },
      children: [
        new TextRun({ text: config.footerLeft || '', size: 22, color: '909090' }),
        new TextRun({ text: '          ' }),
        new TextRun({ text: config.footerRight || '', size: 22, color: '909090' }),
      ],
    }),
  ];

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: { type: 'FIXED' },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: 'exact' },
      children: [new TableCell({
        shading: { fill: 'FFFFFF' }, borders: noBorders, verticalAlign: 'top',
        children: [upperBlock, divider, ...lowerContent],
      })],
    })],
  })];
}

// ============================================================
// BODY CONTENT HELPERS
// ============================================================
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, color: '0B1220',
      font: { ascii: 'Calibri', eastAsia: 'SimHei' } })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(T.accentLine),
      font: { ascii: 'Calibri', eastAsia: 'SimHei' } })],
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { after: 120, line: 312 },
    children: [new TextRun({ text, size: 24, color: '000000',
      font: { ascii: 'Times New Roman', eastAsia: 'Microsoft YaHei' } })],
  });
}

function bodyBold(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { after: 120, line: 312 },
    children: [new TextRun({ text, size: 24, color: '000000', bold: true,
      font: { ascii: 'Times New Roman', eastAsia: 'Microsoft YaHei' } })],
  });
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200, line: 312 },
    children: [new TextRun({ text, size: 21, color: '506070', italics: true,
      font: { ascii: 'Times New Roman' } })],
  });
}

const { imageSize } = require('image-size');
function embedImage(filepath, maxWidthPx = 520) {
  const buf = fs.readFileSync(filepath);
  const dims = imageSize(buf);
  const ratio = dims.height / dims.width;
  let w = maxWidthPx;
  let h = Math.round(w * ratio);
  if (h > 380) { h = 380; w = Math.round(h / ratio); }
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 80 },
    children: [new ImageRun({ data: buf, transformation: { width: w, height: h }, type: 'png' })],
  });
}

function makeHeaderRow(cells) {
  return new TableRow({
    tableHeader: true, cantSplit: true,
    children: cells.map(text => new TableCell({
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, size: 21, color: c(T.headerText) })],
      })],
      shading: { type: ShadingType.CLEAR, fill: c(T.headerBg) },
      borders: { top: NB, bottom: NB, left: NB, right: NB },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
    })),
  });
}

function makeDataRow(cells, index) {
  const bg = index % 2 === 0 ? c(T.surface) : 'FFFFFF';
  return new TableRow({
    cantSplit: true,
    children: cells.map(text => new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, size: 21, color: '000000' })],
      })],
      shading: { type: ShadingType.CLEAR, fill: bg },
      borders: { top: NB, bottom: NB, left: NB, right: NB },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
    })),
  });
}

function makeTable(headers, rows) {
  const colW = Math.floor(100 / headers.length);
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: { type: 'FIXED' },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: c(T.accentLine) },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: c(T.accentLine) },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: c(T.innerLine) },
      insideVertical: NB,
    },
    rows: [
      makeHeaderRow(headers),
      ...rows.map((r, i) => makeDataRow(r, i)),
    ],
  });
}

// ============================================================
// IMAGE PATHS
// ============================================================
const FIG = '/home/z/my-project/scripts/proposal_figures';

// ============================================================
// BUILD DOCUMENT
// ============================================================
async function main() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: { ascii: 'Calibri', eastAsia: 'Microsoft YaHei' }, size: 24, color: '000000' },
          paragraph: { spacing: { line: 312 } },
        },
        heading1: {
          run: { font: { ascii: 'Calibri', eastAsia: 'SimHei' }, size: 32, bold: true, color: '0B1220' },
          paragraph: { spacing: { before: 360, after: 160, line: 312 } },
        },
        heading2: {
          run: { font: { ascii: 'Calibri', eastAsia: 'SimHei' }, size: 28, bold: true, color: c(T.accentLine) },
          paragraph: { spacing: { before: 280, after: 120, line: 312 } },
        },
        heading3: {
          run: { font: { ascii: 'Calibri', eastAsia: 'SimHei' }, size: 24, bold: true, color: '0B1220' },
          paragraph: { spacing: { before: 200, after: 100, line: 312 } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: 'list-features',
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
        },
        {
          reference: 'list-integration',
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
        },
        {
          reference: 'list-roadmap',
          levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
        },
      ],
    },
    sections: [
      // ─── SECTION 1: COVER ───
      {
        properties: {
          page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
        },
        children: buildCoverR4({
          title: 'GHMS: Police Module - The Backbone',
          subtitle: 'System Architecture & Implementation from the Developer Perspective',
          englishLabel: 'TECHNICAL PROPOSAL',
          metaLines: [
            'Guest House Management System (GHMS)',
            'Developer Technical Documentation',
            'August 2026',
          ],
          footerLeft: 'Confidential',
          footerRight: 'v2.0',
          palette: P,
        }),
      },

      // ─── SECTION 2: TOC ───
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
            pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'GHMS Police Module - Technical Proposal', size: 18, color: 'AABBCC',
                font: { ascii: 'Calibri' } })],
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'PAGE  \\* ROMAN \\* MERGEFORMAT', size: 18, color: '888888',
                font: { ascii: 'Calibri' } }), new TextRun({ children: [PageNumber.CURRENT], size: 18 })],
            })],
          }),
        },
        children: [
          new Paragraph({
            spacing: { before: 200, after: 300 },
            children: [new TextRun({ text: 'Table of Contents', size: 36, bold: true, color: '0B1220',
              font: { ascii: 'Calibri', eastAsia: 'SimHei' } })],
          }),
          new TableOfContents('Table of Contents', {
            hyperlink: true, headingStyleRange: '1-3',
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: '(Right-click the TOC and select "Update Field" to refresh page numbers)',
              size: 18, color: 'AAAAAA', italics: true, font: { ascii: 'Calibri' } })],
          }),
          new Paragraph({ children: [new PageBreak()] }),
        ],
      },

      // ─── SECTION 3: BODY ───
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun({ text: 'GHMS Police Module - Technical Proposal', size: 18, color: 'AABBCC',
                font: { ascii: 'Calibri' } })],
            })],
          }),
        },
        footers: {
          default: new Footer({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'PAGE  \\* arabic \\* MERGEFORMAT', size: 18, color: '888888',
                font: { ascii: 'Calibri' } }), new TextRun({ children: [PageNumber.CURRENT], size: 18 })],
            })],
          }),
        },
        children: [

          // ═══════════════════════════════════════════════════
          // 1. EXECUTIVE SUMMARY
          // ═══════════════════════════════════════════════════
          heading1('1. Executive Summary'),
          body('The Guest House Management System (GHMS) is a comprehensive digital platform purpose-built for the Ethiopian hospitality industry. At the core of this system lies the Police Module, a subsystem that is not merely a feature but the structural backbone upon which every other module depends. From a software engineering perspective, the Police Module is the first component that fires when a guest interaction begins, the last component that signs off when a guest departs, and the silent guardian that operates continuously in the background to ensure regulatory compliance and public safety.'),
          body('This technical proposal presents the Police Module from the developer point of view, explaining why it was architected as the central nervous system of GHMS rather than a peripheral add-on. Every guest registration, every room assignment, every payment transaction, and every nightly report passes through or is validated by the Police Module. It is the single source of truth for guest identity verification, the enforcement layer for government regulations, and the real-time intelligence pipeline that connects individual guest houses to the broader law enforcement ecosystem.'),
          body('The following sections provide an in-depth examination of the system architecture, data models, workflow logic, integration patterns, security measures, and implementation roadmap that make the Police Module the indispensable foundation of GHMS. As developers, we believe that the strength of any software system is measured by the robustness of its core, and the Police Module is that core.'),

          // ═══════════════════════════════════════════════════
          // 2. SYSTEM ARCHITECTURE OVERVIEW
          // ═══════════════════════════════════════════════════
          heading1('2. System Architecture Overview'),
          body('GHMS is built on a modern web technology stack comprising Next.js 16, React 19, Prisma 6 ORM, and PostgreSQL. The application follows a server-driven architecture where business logic resides in Next.js API routes, data persistence is handled through Prisma queries to PostgreSQL, and the frontend is rendered server-side for optimal performance and security. The entire system is designed to run on a single local server with Caddy as the reverse proxy and systemd for process management, making it ideal for the Ethiopian deployment context where reliable internet connectivity cannot always be assumed.'),
          body('The architectural decision to place the Police Module at the center of the system was not arbitrary. In the Ethiopian regulatory environment, every guest house is legally required to maintain a police-register of all guests, record their national identification details, and make this information available to law enforcement upon request. Rather than treating this as an afterthought or a secondary feature, we designed the Police Module as the first-class citizen of the system. Every other module interacts with it either by sending data to it or receiving validation from it.'),

          heading2('2.1 Police Module as the Central Hub'),
          body('Figure 1 illustrates the GHMS architecture with the Police Module positioned at the center, surrounded by all other subsystems that depend on it. The Guest Management module cannot create a guest profile without triggering a police verification check. The Booking Engine cannot confirm a reservation without ensuring the guest has a clean police record. The Payment Gateway will not process a transaction for an unverified guest. The Room Inventory module locks rooms until police clearance is obtained. Even the Reporting Analytics module draws its primary data from the police registration records, making the Police Module the single source of truth for all guest-related data in the system.'),

          embedImage(`${FIG}/arch_diagram.png`, 480),
          caption('Figure 1: GHMS Architecture showing the Police Module as the central backbone connecting all subsystems'),

          // ═══════════════════════════════════════════════════
          // 3. POLICE MODULE - CORE DESIGN PHILOSOPHY
          // ═══════════════════════════════════════════════════
          heading1('3. Police Module - Core Design Philosophy'),
          body('The design philosophy of the Police Module is rooted in three fundamental principles that guide every technical decision we make as developers: regulatory compliance by construction, real-time intelligence, and fail-safe enforcement. These principles are not abstract ideals; they are concrete design constraints that shape the database schema, API endpoints, frontend components, and background jobs that comprise the module.'),

          heading2('3.1 Regulatory Compliance by Construction'),
          body('In traditional guest house management, police registration is a manual process where front desk staff fill out paper ledgers that are periodically collected by police officers. This approach is inherently unreliable: entries can be incomplete, illegible, or fabricated. The GHMS Police Module eliminates these failure modes by making compliance the default path rather than an opt-in feature. When a front desk agent opens the guest registration form, the system automatically presents the police-required fields (national ID, full name, nationality, date of birth, purpose of visit) as mandatory inputs that cannot be bypassed. The system validates the format of the national ID, checks it against the internal blacklist database, and creates a timestamped, cryptographically signed police verification record that is tamper-proof.'),

          heading2('3.2 Real-time Intelligence Pipeline'),
          body('The Police Module operates as a real-time intelligence pipeline rather than a passive data store. Every registration event, verification result, and blacklist match is immediately propagated through the system via server-sent events and WebSocket connections. This means that when a flagged guest attempts to check in at any GHMS-connected property, the alert is visible on the police monitoring dashboard within seconds, not hours or days. The system also maintains a running audit log of every data access event, ensuring complete traceability for legal and investigative purposes.'),

          heading2('3.3 Fail-Safe Enforcement'),
          body('The fail-safe principle means that the system defaults to the most restrictive action when something goes wrong. If the blacklist database is unreachable during a guest check-in, the system does not fall through to allowing the check-in; instead, it queues the guest for manual verification and restricts room access until the verification is complete. This design philosophy ensures that temporary system failures never result in regulatory violations or security breaches. Every API endpoint in the Police Module implements this fail-safe pattern at the middleware level, making it impossible for client-side code to bypass the enforcement logic.'),

          // ═══════════════════════════════════════════════════
          // 4. DATA MODEL & ENTITY RELATIONSHIPS
          // ═══════════════════════════════════════════════════
          heading1('4. Data Model & Entity Relationships'),
          body('The data model for the Police Module was designed with careful attention to the relationships between guest identity, police verification status, registration events, and audit trails. Figure 2 presents the core entity relationship diagram that governs the Police Module. The Guest entity stores the master record of every individual who has ever interacted with the GHMS system, indexed primarily by their national identification number. The PoliceRecord entity represents the verification outcome for each guest interaction, capturing who performed the check, when it occurred, and what the result was. The Registration entity links a guest to a specific room and time period, creating the operational record of their stay.'),
          body('The Blacklist entity is a critical security component that stores records of individuals who have been flagged by law enforcement or by the system itself based on suspicious patterns. This table is checked synchronously during every guest check-in attempt, and a match triggers an immediate system-wide alert. The AuditLog entity captures every significant action performed within the Police Module, including data views, modifications, exports, and administrative changes. This comprehensive audit trail is essential for both legal compliance and internal security reviews.'),

          embedImage(`${FIG}/er_diagram.png`, 500),
          caption('Figure 2: Police Module core entity relationship diagram showing Guest, PoliceRecord, Registration, Blacklist, and AuditLog entities'),

          heading2('4.1 Key Database Design Decisions'),
          body('The database schema uses PostgreSQL with Prisma ORM, leveraging PostgreSQL advanced features such as partial indexes on the Blacklist table for fast lookups, JSONB columns for flexible metadata storage on police records, and row-level security policies that prevent unauthorized access to sensitive guest data. The nationalId field across all tables uses a unique constraint with a case-insensitive collation to prevent duplicate entries caused by typographical variations. Foreign key relationships are enforced at the database level, not just at the application level, ensuring data integrity even if a bug in the application code attempts to create orphaned records.'),

          // ═══════════════════════════════════════════════════
          // 5. GUEST REGISTRATION & VERIFICATION FLOW
          // ═══════════════════════════════════════════════════
          heading1('5. Guest Registration & Verification Flow'),
          body('The guest registration flow is the most critical user journey in the entire GHMS system, and it is entirely orchestrated by the Police Module. From the moment a guest walks into a property to the moment they receive their room key, every step is mediated by police verification logic. Figure 3 illustrates the complete workflow, which we will now examine in detail from the implementation perspective.'),
          body('When a guest arrives at the property, the front desk agent opens the registration form, which is a React component that renders a series of validated input fields. The form collects the guest full name, national ID number, phone number, date of birth, nationality, occupation, and purpose of visit. These fields map directly to the Guest entity in the database, and the form validation runs both client-side (for immediate user feedback) and server-side (for security enforcement) checks before any data is written.'),
          body('Upon form submission, the system executes a series of backend operations in a single database transaction. First, it upserts the Guest record using the national ID as the natural key, ensuring that returning guests are recognized and their history is preserved. Second, it queries the Blacklist table in real-time to check whether the guest national ID matches any flagged records. If a match is found, the transaction is rolled back, the front desk is immediately notified with a red alert banner, and the guest is denied check-in. If no match is found, a PoliceRecord is created with a status of VERIFIED, and the Registration record is created to assign the guest to a room.'),

          embedImage(`${FIG}/flow_diagram.png`, 440),
          caption('Figure 3: Guest registration and police verification workflow showing the complete check-in process from arrival to room assignment'),

          heading2('5.1 Technical Implementation of the Verification Pipeline'),
          body('The verification pipeline is implemented as a series of middleware functions in the Next.js API route handler. The first middleware validates the incoming request payload against a Zod schema, rejecting any malformed data before it reaches the database. The second middleware checks the blacklist using a parameterized SQL query that is immune to injection attacks. The third middleware creates the police verification record within a Prisma transaction that spans both the Guest upsert and the PoliceRecord insertion. If any step fails, the entire transaction is rolled back, and the guest is placed in a PENDING_REVIEW state rather than being silently rejected or incorrectly approved.'),

          // ═══════════════════════════════════════════════════
          // 6. REAL-TIME MONITORING & ALERT SYSTEM
          // ═══════════════════════════════════════════════════
          heading1('6. Real-time Monitoring & Alert System'),
          body('The monitoring and alert subsystem is what transforms the Police Module from a passive record-keeping system into an active security platform. The real-time monitoring dashboard, shown in Figure 4, provides law enforcement personnel and property administrators with a live view of all guest activities across all connected properties. The dashboard is implemented as a server-rendered React component that receives live updates through a WebSocket connection, ensuring that new registrations, verification results, and alerts appear on screen within seconds of occurring.'),
          body('The dashboard presents four key performance indicators at the top: total guests checked in today, total verified guests, pending reviews requiring manual attention, and flagged guests who matched the blacklist. Below these KPIs, a weekly check-in bar chart provides trend visibility, while a real-time alert feed shows the most recent security events with color-coded severity levels. The system status bar at the bottom confirms the operational health of the entire platform, including database connectivity, WebSocket status, and uptime metrics.'),

          embedImage(`${FIG}/dashboard_mockup.png`, 500),
          caption('Figure 4: Police monitoring dashboard showing real-time KPIs, weekly check-in trends, and live security alerts'),

          heading2('6.1 WebSocket Architecture for Live Updates'),
          body('The real-time update system uses a WebSocket server integrated into the Next.js application through a custom server configuration. When a police-relevant event occurs (such as a new guest registration, a blacklist match, or a verification status change), the API route handler publishes the event to an in-memory event bus. The WebSocket server subscribes to this event bus and broadcasts the event to all connected clients who have the appropriate role-based permissions to view the data. This architecture avoids the overhead and complexity of a separate message broker while still providing sub-second latency for live updates.'),

          heading2('6.2 Alert Severity and Escalation Logic'),
          body('The alert system implements a three-tier severity model. Green alerts indicate routine verified check-ins that require no action. Orange alerts indicate pending verifications that have not been resolved within a configurable time window, typically 30 minutes. Red alerts indicate blacklist matches or other critical security events that require immediate attention. Red alerts trigger both in-system notifications and, when configured, external notifications via email or SMS to designated law enforcement contacts. The escalation logic is implemented as a background job that runs every five minutes, scanning for orange alerts that have exceeded their resolution time window and escalating them to red status with additional notifications.'),

          heading2('6.3 Suspect Match Alert - Detailed Information'),
          body('When the system detects a suspect match during guest registration or booking pre-verification, the red alert generated contains comprehensive information that equips law enforcement and property administrators with everything needed to assess and respond to the situation. The alert is designed to go beyond simple identity matching by including the full context of the guest interaction, particularly the room reservation details that tell officers exactly where the individual is or intends to stay. This section describes the complete data payload of a suspect match alert.'),
          body('The alert payload is divided into three categories: suspect identity information, room reservation details, and system metadata. The suspect identity section contains the guest full name as provided during registration, their national ID number, nationality, date of birth, phone number, and the reason they were flagged, which may be an explicit blacklist entry or a pattern-based anomaly detection flag. The system metadata section includes the alert timestamp, the source property name and branch, the name of the front desk agent who processed the registration, and a unique alert ID for cross-referencing in the audit log.'),
          body('The room reservation details section is the most operationally critical part of the alert, as it tells law enforcement exactly where the suspect is located or plans to stay. This section includes the reservation confirmation ID, the assigned room number and room type, the check-in and check-out dates, the current reservation status, the number of accompanying guests if any, and the total booking amount paid or pending. If the guest has a history of previous stays at any GHMS-connected property, those past registration records are also attached to the alert, providing officers with a complete movement history. The following table presents the complete suspect match alert detail structure.'),

          makeTable(
            ['Category', 'Field', 'Description'],
            [
              ['Suspect Identity', 'Full Name', 'Full legal name as provided during registration'],
              ['Suspect Identity', 'National ID', 'Government-issued national identification number'],
              ['Suspect Identity', 'Nationality', 'Country of citizenship as declared by the guest'],
              ['Suspect Identity', 'Date of Birth', 'Date of birth for age verification and identification'],
              ['Suspect Identity', 'Phone Number', 'Contact phone number provided at registration'],
              ['Suspect Identity', 'Flag Reason', 'Specific reason for the alert: blacklist entry, watchlist match, or anomaly detection'],
              ['Room Reservation', 'Reservation ID', 'Unique confirmation ID generated by the booking engine'],
              ['Room Reservation', 'Room Number', 'Assigned room number where the suspect intends to stay'],
              ['Room Reservation', 'Room Type', 'Category of the room: Single, Double, Suite, or Dormitory'],
              ['Room Reservation', 'Check-in Date', 'Scheduled or actual date of arrival at the property'],
              ['Room Reservation', 'Check-out Date', 'Scheduled date of departure from the property'],
              ['Room Reservation', 'Reservation Status', 'Current status: CONFIRMED, CHECKED_IN, PENDING, or CANCELLED'],
              ['Room Reservation', 'Accompanying Guests', 'Number of additional guests registered under the same reservation'],
              ['Room Reservation', 'Booking Amount', 'Total reservation cost and current payment status: PAID, PARTIAL, or UNPAID'],
              ['Room Reservation', 'Previous Stays', 'List of past registration records at any GHMS-connected property'],
              ['System Metadata', 'Alert Timestamp', 'Exact date and time the alert was triggered by the system'],
              ['System Metadata', 'Property Name', 'Name and branch of the guest house where the match occurred'],
              ['System Metadata', 'Processed By', 'Name of the front desk agent who handled the registration'],
              ['System Metadata', 'Alert ID', 'Unique system-generated identifier for audit trail cross-referencing'],
            ]
          ),
          caption('Table 3: Complete suspect match alert detail structure showing identity, room reservation, and system metadata fields'),

          body('This comprehensive alert structure ensures that when a suspect match is detected, the responding officer or administrator has immediate access to all relevant information without needing to navigate to separate screens or make additional database queries. The room reservation details, in particular, transform the alert from a simple identity notification into an actionable intelligence brief that tells law enforcement not just who the suspect is, but where they are, when they arrived, when they plan to leave, who they are with, and whether they have stayed at other properties in the network before. This level of integrated detail is only possible because the Police Module sits at the center of the GHMS architecture and has direct access to reservation data from the Booking Engine and room assignment data from the Room Inventory module.'),

          // ═══════════════════════════════════════════════════
          // 7. INTEGRATION POINTS
          // ═══════════════════════════════════════════════════
          heading1('7. Integration Points - Connecting Every Subsystem'),
          body('The true power of the Police Module becomes apparent when we examine how it integrates with every other subsystem in GHMS. Rather than existing as an isolated component, the Police Module exposes a set of well-defined interfaces that other modules consume. These integration points are illustrated in Figure 5 and described in detail below. Each integration represents a bidirectional data flow that ensures consistency and enforcement across the entire system.'),

          embedImage(`${FIG}/integration_diagram.png`, 480),
          caption('Figure 5: Police Module integration points showing bidirectional connections to all seven surrounding subsystems'),

          heading2('7.1 Integration with Guest Management'),
          body('The Guest Management module and the Police Module share the Guest entity as their common data foundation. When a new guest is registered through the police verification flow, the Guest Management module automatically receives the created profile and can immediately display the guest history, preferences, and stay records. Conversely, when the Guest Management module updates a guest phone number or email address, the Police Module receives the update through a Prisma middleware hook that logs the change in the AuditLog. This bidirectional synchronization ensures that both modules always operate on the same version of the truth without requiring manual data reconciliation.'),

          heading2('7.2 Integration with Booking Engine'),
          body('The Booking Engine pre-verifies guests at the time of reservation creation, not just at check-in. When a booking is made, the system performs a lightweight blacklist check against the guest national ID provided during the reservation. If the guest is flagged, the booking is rejected with a clear message explaining that the reservation cannot be processed. This pre-verification step prevents the awkward and potentially dangerous situation where a flagged guest arrives at a property expecting a room that they will not be allowed to occupy. The Booking Engine also exposes an API that the Police Module calls to automatically cancel bookings for guests who are added to the blacklist after their reservation was made.'),

          heading2('7.3 Integration with Payment Gateway'),
          body('The Payment Gateway integration enforces a simple but powerful rule: no payment processing without a valid police verification. When a guest attempts to make a payment through the Telebirr H5 C2B payment flow, the system first checks the Police Module to confirm that the guest has a VERIFIED status. If the guest is unverified or flagged, the payment request is blocked before it reaches the Telebirr API, saving both the property and the payment provider from unnecessary transaction processing. This integration point is critical for regulatory compliance, as it ensures that no financial transaction occurs for a guest who has not been properly registered with the police.'),

          heading2('7.4 Integration with Notification Service'),
          body('The Notification Service consumes events from the Police Module to deliver targeted alerts to the appropriate recipients. When a blacklist match occurs, the Notification Service sends an immediate push notification to the property manager, an email to the designated law enforcement liaison, and optionally an SMS to the local police station. When a guest checks out, the Notification Service can trigger a summary notification to the police dashboard. The event-driven architecture means that the Notification Service does not need to poll the Police Module for changes; instead, it simply subscribes to the event types it cares about and reacts accordingly.'),

          // ═══════════════════════════════════════════════════
          // 8. TECHNOLOGY STACK & SECURITY
          // ═══════════════════════════════════════════════════
          heading1('8. Technology Stack & Security Architecture'),
          body('The Police Module is built on the same technology stack as the broader GHMS platform, but it makes heavier use of certain components due to its security-critical nature. The following table summarizes the key technologies and their specific roles within the Police Module.'),

          makeTable(
            ['Technology', 'Version', 'Role in Police Module'],
            [
              ['Next.js', '16', 'Server-side rendering, API routes, middleware chain for verification pipeline'],
              ['React', '19', 'Dynamic dashboard components, real-time alert feed, registration forms'],
              ['Prisma ORM', '6', 'Type-safe database queries, migration management, transaction support'],
              ['PostgreSQL', '16', 'Primary data store with partial indexes, JSONB, row-level security'],
              ['Caddy', '2.x', 'HTTPS reverse proxy with automatic TLS certificate management'],
              ['JWT', 'HS256', 'Stateless authentication with role-based access control'],
              ['WebSocket', 'Native', 'Real-time event broadcasting for live dashboard updates'],
              ['systemd', '255', 'Process supervision with automatic restart on failure'],
            ]
          ),
          caption('Table 1: Technology stack and its role within the Police Module'),

          heading2('8.1 Authentication and Authorization'),
          body('Access to the Police Module is governed by a role-based access control (RBAC) system implemented with JSON Web Tokens. Every API request to a police-related endpoint must include a valid JWT in the Authorization header. The JWT payload contains the user role (ADMIN, POLICE_OFFICER, FRONT_DESK, VIEWER), property ID, and expiration timestamp. The middleware layer on each API route checks the role against the required permission level for that endpoint. For example, the blacklist management endpoints require the POLICE_OFFICER role, while the guest registration endpoints are accessible to both FRONT_DESK and POLICE_OFFICER roles. The VIEWER role provides read-only access to the monitoring dashboard without the ability to modify any records.'),

          heading2('8.2 Data Encryption and Integrity'),
          body('All data transmitted between the client and server is encrypted in transit using TLS 1.3, provided automatically by the Caddy reverse proxy. Sensitive guest data, including national ID numbers, is encrypted at rest using PostgreSQL pgcrypto extension with AES-256 encryption. The encryption keys are managed through environment variables that are stored outside the application codebase, ensuring that a source code breach does not compromise the encrypted data. Database backups are also encrypted, and the backup rotation policy ensures that no unencrypted copy of the guest database exists on any storage medium.'),

          // ═══════════════════════════════════════════════════
          // 9. IMPLEMENTATION ROADMAP
          // ═══════════════════════════════════════════════════
          heading1('9. Implementation Roadmap'),
          body('From the developer perspective, the implementation of the Police Module follows a phased approach that prioritizes core functionality first, then layers on advanced features incrementally. This phased approach allows us to deliver a working system quickly while maintaining the architectural integrity needed for long-term extensibility. Each phase builds on the previous one, and the modular design of the Police Module means that changes in one phase do not require re-architecting the entire system.'),

          makeTable(
            ['Phase', 'Focus Area', 'Key Deliverables'],
            [
              ['Phase 1', 'Core Registration', 'Guest registration form, national ID validation, basic police record creation, room assignment flow'],
              ['Phase 2', 'Blacklist System', 'Blacklist database, real-time check during registration, alert notifications, admin management UI'],
              ['Phase 3', 'Monitoring Dashboard', 'Real-time WebSocket dashboard, KPI cards, weekly charts, alert feed, status monitoring'],
              ['Phase 4', 'Reporting Engine', 'Daily/weekly/monthly police reports, export to PDF, automated report scheduling, analytics charts'],
              ['Phase 5', 'Advanced Integration', 'Booking pre-verification, payment blocking for unverified guests, notification service hooks, audit trail hardening'],
              ['Phase 6', 'Production Hardening', 'Load testing, security audit, penetration testing, performance optimization, deployment automation'],
            ]
          ),
          caption('Table 2: Phased implementation roadmap for the Police Module'),

          body('Each phase is designed to be deployable independently, meaning that after Phase 1, the system can already be used for basic guest registration with police records. Phase 2 adds the security layer. Phase 3 adds visibility. Phase 4 adds compliance reporting. Phase 5 adds cross-module enforcement. And Phase 6 ensures that the entire system is production-ready and can handle the expected load of multiple properties registering guests simultaneously.'),

          // ═══════════════════════════════════════════════════
          // 10. CONCLUSION
          // ═══════════════════════════════════════════════════
          heading1('10. Conclusion'),
          body('The Police Module is not just another feature of the Guest House Management System; it is the foundational layer that gives the entire platform its purpose and legitimacy. By designing it as the central backbone from the very first line of code, we have created a system where regulatory compliance is not an afterthought but an inherent property of the architecture. Every guest interaction passes through the Police Module, every other module depends on its data and validation, and the system as a whole is stronger because of this design choice.'),
          body('From a software engineering standpoint, the decision to make the Police Module the core of GHMS reflects a fundamental principle: the most important business requirement should drive the architecture, not the other way around. In the Ethiopian context, the legal requirement for guest registration with police is the single most critical function that a guest house management system must perform. By building the architecture around this requirement, we have ensured that GHMS is not only compliant but also resilient, extensible, and genuinely useful to both property owners and law enforcement agencies.'),
          body('The diagrams, data models, and integration patterns presented in this proposal represent the culmination of careful architectural thinking and iterative design. The Police Module is ready for implementation, and the phased roadmap provides a clear path from development to deployment. As developers, we are confident that this system will set a new standard for digital guest house management in Ethiopia, with the Police Module serving as the unwavering backbone that holds everything together.'),

        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = '/home/z/my-project/download/GHMS_Police_Module_Technical_Proposal.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('Document saved to: ' + outPath);
}

main().catch(err => { console.error(err); process.exit(1); });
