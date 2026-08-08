const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, AlignmentType, WidthType, BorderStyle,
  PageBreak, HeadingLevel,
} = require("docx");
const fs = require("fs");

// === Safe text helper ===
function safeText(value, placeholder) {
  if (value === undefined || value === null || value === "" || String(value) === "NaN" || String(value) === "undefined") {
    return placeholder || "【Please fill in】";
  }
  return String(value);
}

// === Constants ===
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const noBordersAll = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// Font settings (English contract)
const BODY_FONT = "Times New Roman";
const HEADING_FONT = "Times New Roman";
const BODY_SIZE = 24; // 12pt
const LINE_SPACING = 360; // 1.5x for contracts

// === Party Info Block Builder ===
function partyInfoBlock(partyLabel, partyName, fields) {
  const headerPara = new Paragraph({
    spacing: { before: 300, after: 160, line: LINE_SPACING },
    children: [
      new TextRun({
        text: `${partyLabel}: ${safeText(partyName, "【Full legal name】")}`,
        size: 24,
        font: HEADING_FONT,
        bold: true,
        color: "000000",
      }),
    ],
  });

  const infoTable = new Table({
    width: { size: 90, type: WidthType.PERCENTAGE },
    borders: noBordersAll,
    rows: fields.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              borders: noBorders,
              margins: { top: 40, bottom: 40, left: 420, right: 60 },
              children: [
                new Paragraph({
                  spacing: { line: LINE_SPACING },
                  children: [
                    new TextRun({
                      text: `${label}:`,
                      size: 24,
                      font: BODY_FONT,
                      color: "000000",
                    }),
                  ],
                }),
              ],
            }),
            new TableCell({
              borders: noBorders,
              margins: { top: 40, bottom: 40, left: 60, right: 120 },
              children: [
                new Paragraph({
                  spacing: { line: LINE_SPACING },
                  children: [
                    new TextRun({
                      text: safeText(value, `【Please fill in: ${label}】`),
                      size: 24,
                      font: BODY_FONT,
                      color: "000000",
                    }),
                  ],
                }),
              ],
            }),
          ],
        })
    ),
  });

  return [headerPara, infoTable];
}

// === Body Paragraph Builder ===
function bodyPara(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { after: 80, line: LINE_SPACING },
    ...opts,
    children: [
      new TextRun({
        text: text,
        size: BODY_SIZE,
        font: BODY_FONT,
        color: "000000",
      }),
    ],
  });
}

// === Sub-clause Paragraph (no indent, with numbering prefix) ===
function subClause(text, indent = 720) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { left: indent, hanging: 360 },
    spacing: { after: 60, line: LINE_SPACING },
    children: [
      new TextRun({
        text: text,
        size: BODY_SIZE,
        font: BODY_FONT,
        color: "000000",
      }),
    ],
  });
}

// === Sub-sub-clause (deeper indent) ===
function subSubClause(text) {
  return subClause(text, 1080);
}

// === Article Heading ===
function articleHeading(text) {
  return new Paragraph({
    spacing: { before: 300, after: 160, line: LINE_SPACING },
    children: [
      new TextRun({
        text: text,
        size: 24,
        font: HEADING_FONT,
        bold: true,
        color: "000000",
      }),
    ],
  });
}

// === Signature Block Builder ===
function buildSignatureBlock(partyA, partyB) {
  const fields = [
    ["Party (Seal)", "Party (Seal)"],
    ["Legal Rep / Authorized Rep (Signature)", "Legal Rep / Authorized Rep (Signature)"],
    ["Contact Person", "Contact Person"],
    ["Contact Info", "Contact Info"],
    ["Signing Location", "Signing Location"],
    ["Date", "Date"],
  ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBordersAll,
    rows: fields.map(([labelA, labelB], i) => {
      const isDate = i === fields.length - 1;
      const aVal = isDate ? "【____/____/____】" : safeText(partyA?.[i], "【Please fill in】");
      const bVal = isDate ? "【____/____/____】" : safeText(partyB?.[i], "【Please fill in】");
      const displayA = i === 0 ? `Party A: ${aVal}` : `${labelA}: ${aVal}`;
      const displayB = i === 0 ? `Party B: ${bVal}` : `${labelB}: ${bVal}`;

      return new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            margins: { top: 80, bottom: 80, left: 120, right: 60 },
            children: [
              new Paragraph({
                spacing: { line: LINE_SPACING },
                children: [
                  new TextRun({ text: displayA, size: 24, color: "000000", font: BODY_FONT }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: noBorders,
            margins: { top: 80, bottom: 80, left: 60, right: 120 },
            children: [
              new Paragraph({
                spacing: { line: LINE_SPACING },
                children: [
                  new TextRun({ text: displayB, size: 24, color: "000000", font: BODY_FONT }),
                ],
              }),
            ],
          }),
        ],
      });
    }),
  });
}

// === DOCUMENT CONTENT ===

const children = [];

// --- Title ---
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200, line: Math.ceil(22 * 23), lineRule: "atLeast" },
    children: [
      new TextRun({
        text: "Guest House Service Registration and Time Use Agreement",
        size: 44, // Er Hao 22pt
        bold: true,
        color: "000000",
        font: HEADING_FONT,
      }),
    ],
  })
);

// --- Contract Number ---
children.push(
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 120, line: LINE_SPACING },
    children: [
      new TextRun({
        text: "Contract No.: 【Please fill in】",
        size: 21, // Wu Hao 10.5pt
        font: BODY_FONT,
        color: "000000",
      }),
    ],
  })
);

// --- Date and Location ---
children.push(
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 60, line: LINE_SPACING },
    children: [
      new TextRun({
        text: "Date: 【____/____/____】",
        size: 21,
        font: BODY_FONT,
        color: "000000",
      }),
    ],
  })
);
children.push(
  new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { after: 200, line: LINE_SPACING },
    children: [
      new TextRun({
        text: "Location: 【Please fill in: City, Country】",
        size: 21,
        font: BODY_FONT,
        color: "000000",
      }),
    ],
  })
);

// --- Party Information ---
const partyAInfo = partyInfoBlock("Party A (Platform Operator)", "【Platform Operator Full Legal Name】", [
  ["Address", "【Please fill in: Full address】"],
  ["Legal Representative", "【Please fill in】"],
  ["License / Registration No.", "【Please fill in】"],
  ["Contact Phone", "【Please fill in】"],
  ["Contact Email", "【Please fill in】"],
]);
children.push(...partyAInfo);

const partyBInfo = partyInfoBlock("Party B (Guest House Provider)", "【Guest House Name】", [
  ["Address", "【Please fill in: Full address】"],
  ["Owner / Legal Representative", "【Please fill in】"],
  ["Business License No.", "【Please fill in】"],
  ["Contact Phone", "【Please fill in】"],
  ["Contact Email", "【Please fill in】"],
]);
children.push(...partyBInfo);

// --- Recitals ---
children.push(
  new Paragraph({ spacing: { before: 300, after: 120, line: LINE_SPACING }, children: [] })
);
children.push(bodyPara(
  "WHEREAS, Party A operates a digital Guest House Management System (hereinafter referred to as the \"Platform\") that provides guest house registration, reservation management, guest tracking, and regulatory compliance monitoring services;"
));
children.push(bodyPara(
  "WHEREAS, Party B owns and operates a guest house establishment (hereinafter referred to as the \"Establishment\") and desires to register and utilize the Platform for the purpose of managing its operations in compliance with applicable laws and regulations;"
));
children.push(bodyPara(
  "WHEREAS, both parties desire to enter into this agreement to define the terms and conditions under which Party B shall register on the Platform, access its services, and use the system for time-based management of guest house operations;"
));
children.push(bodyPara(
  "NOW, THEREFORE, in consideration of the mutual covenants and agreements contained herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:"
));

// --- Article 1: Definitions and Interpretation ---
children.push(articleHeading("Article 1  Definitions and Interpretation"));
children.push(subClause("1.1  \"Platform\" means the digital Guest House Management System operated by Party A, including all associated web applications, mobile interfaces, databases, and support services."));
children.push(subClause("1.2  \"Establishment\" means the guest house, hotel, lodge, homestay, resort, or similar hospitality business owned and operated by Party B at the address specified in this Agreement."));
children.push(subClause("1.3  \"Service Period\" means the duration of time for which Party B is authorized to access and use the Platform, as determined by the selected subscription cycle and subject to timely payment of all applicable fees."));
children.push(subClause("1.4  \"Subscription Cycle\" means the recurring time period for which Party B subscribes to the Platform services, which may be Monthly (30 days), Quarterly (90 days), Semi-Annual (180 days), or Yearly (365 days)."));
children.push(subClause("1.5  \"Trial Period\" means the initial complimentary access period of fifteen (15) calendar days granted to newly approved providers, during which the full functionality of the Platform is available at no charge."));
children.push(subClause("1.6  \"Grace Period\" means the additional period of two (2) calendar days after the expiration of a Service Period during which Party B may still access the Platform to facilitate payment renewal before full suspension."));
children.push(subClause("1.7  \"Guest Data\" means all information related to guests staying at the Establishment, including but not limited to personal identification details, check-in and check-out dates, room assignments, and reservation records."));
children.push(subClause("1.8  \"Regulatory Authority\" means the relevant police department or other government body responsible for licensing, supervising, and regulating guest house operations in the jurisdiction where the Establishment is located."));

// --- Article 2: Subject Matter and Scope ---
children.push(articleHeading("Article 2  Subject Matter and Scope of Services"));
children.push(subClause("2.1  Party A shall provide Party B with access to the Platform for the purpose of managing the Establishment\'s daily operations. The Platform services include, but are not limited to: room inventory management, guest reservation and check-in/check-out tracking, guest registration and record-keeping, daytime service booking management, expense tracking, housekeeping task scheduling, and regulatory reporting capabilities."));
children.push(subClause("2.2  Party A shall ensure that the Platform maintains a minimum availability of ninety-five percent (95%) during each calendar month, excluding scheduled maintenance periods for which Party A shall provide at least twenty-four (24) hours of advance notice."));
children.push(subClause("2.3  Party A reserves the right to update, modify, or improve the Platform\'s features and functionality. Material changes that affect the core usability of the Platform shall be communicated to Party B at least seven (7) calendar days before implementation."));
children.push(subClause("2.4  The Platform is provided solely for the internal management of the Establishment. Party B shall not use the Platform for any unlawful purpose, nor shall Party B permit any third party to access the Platform without the prior written consent of Party A."));

// --- Article 3: Registration and Approval ---
children.push(articleHeading("Article 3  Registration and Approval"));
children.push(subClause("3.1  Party B shall complete the registration process by submitting the required information through the Platform or as directed by Party A, including but not limited to: the full legal name and type of the Establishment, business license number and a copy of the valid license document, the physical address and geographic coordinates of the Establishment, owner or authorized representative identification, and valid contact information."));
children.push(subClause("3.2  Upon submission of the registration application, Party A shall review the information and forward the application to the relevant Regulatory Authority for approval. Party B acknowledges that the approval process is conducted by the Regulatory Authority and that Party A does not guarantee or control the outcome of such approval."));
children.push(subClause("3.3  If the Regulatory Authority rejects the application, Party A shall notify Party B in writing of the rejection and the reasons provided by the Regulatory Authority. Party B may address the identified deficiencies and submit a revised application within thirty (30) calendar days of receiving the rejection notice."));
children.push(subClause("3.4  Upon approval by the Regulatory Authority, Party A shall activate Party B\'s account on the Platform and grant access credentials to the authorized operator designated by Party B. Party B shall be responsible for maintaining the confidentiality and security of all account credentials."));

// --- Article 4: Subscription and Time of Use ---
children.push(articleHeading("Article 4  Subscription and Time of Use"));
children.push(subClause("4.1  Following the expiration of the Trial Period, Party B shall select a Subscription Cycle and pay the corresponding subscription fee to continue accessing the Platform. The available Subscription Cycles and their respective fees are as follows:"));

// Subscription Table
const subTableBorders = {
  top: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 2, color: "000000" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
};

const subTable = new Table({
  width: { size: 80, type: WidthType.PERCENTAGE },
  alignment: AlignmentType.CENTER,
  borders: subTableBorders,
  rows: [
    new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [
        ["Subscription Cycle", 25], ["Duration", 25], ["Fee (ETB)", 25], ["Fee per Day (ETB)", 25],
      ].map(
        ([text, w]) =>
          new TableCell({
            width: { size: w, type: WidthType.PERCENTAGE },
            borders: noBorders,
            shading: { type: "CLEAR", fill: "F0F0F0" },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text, bold: true, size: 22, font: BODY_FONT, color: "000000" })],
              }),
            ],
          })
      ),
    }),
    ...[
      ["Monthly", "30 calendar days", "【Please fill in】", "【Please fill in】"],
      ["Quarterly", "90 calendar days", "【Please fill in】", "【Please fill in】"],
      ["Semi-Annual", "180 calendar days", "【Please fill in】", "【Please fill in】"],
      ["Yearly", "365 calendar days", "【Please fill in】", "【Please fill in】"],
    ].map(
      (row) =>
        new TableRow({
          cantSplit: true,
          children: row.map(
            (text, i) =>
              new TableCell({
                width: { size: 25, type: WidthType.PERCENTAGE },
                borders: noBorders,
                margins: { top: 60, bottom: 60, left: 120, right: 120 },
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text, size: 22, font: BODY_FONT, color: "000000" })],
                  }),
                ],
              })
          ),
        })
    ),
  ],
});
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 120 },
    keepNext: true,
    children: [new TextRun({ text: "Table 1: Subscription Cycle Fees", size: 21, font: BODY_FONT, color: "000000", italics: true })],
  })
);
children.push(subTable);

children.push(subClause("4.2  The Service Period shall commence on the date of activation or renewal and shall continue for the duration of the selected Subscription Cycle. Party A shall calculate the end date of each Service Period and communicate it to Party B through the Platform\'s dashboard."));
children.push(subClause("4.3  When Party B renews a subscription before the current Service Period expires, the new Service Period shall commence from the day following the current end date. If Party B renews after the current Service Period has expired, the new Service Period shall commence from the date of payment, and any unused time from the previous period shall be forfeited."));
children.push(subClause("4.4  Party A shall send a reminder notification to Party B at least seven (7) calendar days before the expiration of each Service Period. Party B acknowledges that it is solely responsible for timely renewal, and that failure to renew shall result in the consequences described in Article 8 of this Agreement."));
children.push(subClause("4.5  During the Trial Period, Party B shall have full access to all Platform features at no charge. The Trial Period is non-renewable and is granted solely to newly approved providers who have not previously held an active subscription."));

// --- Article 5: Service Fees and Payment ---
children.push(articleHeading("Article 5  Service Fees and Payment Terms"));
children.push(subClause("5.1  Party B shall pay the subscription fee corresponding to the selected Subscription Cycle in accordance with the fee schedule set forth in Table 1 above. All fees are denominated in Ethiopian Birr (ETB) and are exclusive of any applicable taxes."));
children.push(subClause("5.2  Payment shall be made through the methods designated by Party A, which may include bank transfer, mobile money, or other electronic payment channels accepted on the Platform. Party A shall issue a payment confirmation receipt upon successful receipt of each payment."));
children.push(subClause("5.3  Party B shall make payment prior to or on the first day of each new Service Period. In the event of late payment, a late payment penalty of ten percent (10%) of the outstanding amount may be applied for each full calendar week of delay, up to a maximum of the full subscription fee amount."));
children.push(subClause("5.4  Party A shall maintain a record of all payments made by Party B and shall make such records available for review upon request. In the event of a payment dispute, Party B shall notify Party A in writing within fifteen (15) calendar days of the disputed payment."));
children.push(subClause("5.5  Party A reserves the right to adjust the subscription fees with thirty (30) calendar days\' prior written notice. Such adjustments shall take effect at the start of the next renewal cycle following the notice period."));

// --- Article 6: Rights and Obligations of Party A ---
children.push(articleHeading("Article 6  Rights and Obligations of Party A"));
children.push(subClause("6.1  Party A shall maintain the Platform in good working order and provide technical support to Party B during normal business hours. Technical support requests shall be addressed within a reasonable timeframe, and critical system failures affecting multiple providers shall be prioritized."));
children.push(subClause("6.2  Party A shall implement and maintain reasonable security measures to protect the data stored on the Platform, including Guest Data submitted by Party B. Security measures shall include encryption of sensitive data, access control mechanisms, and regular security audits."));
children.push(subClause("6.3  Party A shall facilitate the regulatory approval process by forwarding Party B\'s registration application to the relevant Regulatory Authority and communicating the approval outcome to Party B in a timely manner."));
children.push(subClause("6.4  Party A shall provide Party B with a warning notification when the Service Period enters the warning phase (seven (7) calendar days or fewer remaining) and again when it enters the Grace Period. During the warning phase, new guest check-ins and new reservations may be restricted as a reminder to renew."));
children.push(subClause("6.5  Party A reserves the right to suspend or terminate Party B\'s access to the Platform in accordance with the provisions of Article 8 of this Agreement, or as required by law or directive from the Regulatory Authority."));

// --- Article 7: Rights and Obligations of Party B ---
children.push(articleHeading("Article 7  Rights and Obligations of Party B"));
children.push(subClause("7.1  Party B shall use the Platform solely for the lawful management of the Establishment and in compliance with all applicable laws, regulations, and directives issued by the Regulatory Authority. Party B shall ensure that all guest information is recorded accurately and in a timely manner."));
children.push(subClause("7.2  Party B shall maintain a valid and current business license for the Establishment at all times during the Service Period. In the event that the license expires, is revoked, or is suspended, Party B shall immediately notify Party A and the Platform access may be suspended until a valid license is reinstated."));
children.push(subClause("7.3  Party B shall be solely responsible for the accuracy and completeness of all data entered into the Platform. Party B shall ensure that all guest check-ins are recorded with valid identification documents and that check-out records are updated upon guest departure."));
children.push(subClause("7.4  Party B shall not attempt to reverse-engineer, decompile, disassemble, or otherwise gain unauthorized access to the Platform\'s source code, databases, or underlying technology. Party B shall not use automated scripts, bots, or other means to extract data from the Platform in bulk without the prior written consent of Party A."));
children.push(subClause("7.5  Party B shall promptly notify Party A of any unauthorized access to the Platform or any suspected data breach. Party B shall cooperate with Party A in investigating and remedying any security incidents."));
children.push(subClause("7.6  Party B acknowledges that the Platform provides time-based operational tools, including but not limited to: scheduling of guest check-in (default 14:00) and check-out (default 12:00) times, reservation duration tracking, daytime service booking with time slots, and housekeeping task scheduling. Party B shall ensure that these time-based features are used in accordance with the Platform\'s operational guidelines."));

// --- Article 8: Service Period Expiration, Suspension, and Termination ---
children.push(articleHeading("Article 8  Service Period Expiration, Suspension, and Termination"));
children.push(subClause("8.1  Upon expiration of the Service Period, the following phased restriction approach shall apply:"));
children.push(subSubClause("(1) Warning Phase: When seven (7) calendar days or fewer remain in the Service Period, the Platform shall display a prominent warning notification. During this phase, Party B may continue to use existing features but shall be restricted from creating new guest check-ins and new reservations."));
children.push(subSubClause("(2) Grace Period: Upon expiration of the Service Period, a Grace Period of two (2) calendar days shall commence. During this period, the Platform shall display a critical warning and Party B\'s access shall be limited to viewing existing data and processing payment renewal. No new operational activities shall be permitted."));
children.push(subSubClause("(3) Suspension: If the Service Period expires and Party B has not renewed within the Grace Period, the Platform shall fully suspend Party B\'s access. A full-screen suspension notice shall be displayed, and Party B shall not be able to access any Platform features until the subscription is renewed."));
children.push(subClause("8.2  Party A may suspend Party B\'s access to the Platform immediately and without prior notice in the following circumstances: (a) the Regulatory Authority directs the suspension of the Establishment\'s operations; (b) Party B is found to be using the Platform for unlawful purposes; (c) Party B materially breaches any provision of this Agreement and fails to cure such breach within fifteen (15) calendar days of receiving written notice from Party A; or (d) Party B\'s business license has been revoked or expired."));
children.push(subClause("8.3  Either party may terminate this Agreement by providing thirty (30) calendar days\' written notice to the other party. In the event of termination, Party B shall ensure that all outstanding fees are settled, and Party A shall provide Party B with a reasonable opportunity to export its data from the Platform within thirty (30) calendar days of the termination date."));
children.push(subClause("8.4  Upon termination or permanent suspension, Party A shall, after a ninety (90) calendar day retention period, permanently delete all data associated with Party B\'s account from the Platform\'s databases, unless otherwise required by applicable law or regulation."));

// --- Article 9: Data Management and Privacy ---
children.push(articleHeading("Article 9  Data Management and Privacy"));
children.push(subClause("9.1  Party B acknowledges that all Guest Data entered into the Platform is collected, stored, and processed in accordance with applicable data protection laws and regulations. Party A shall act as a data processor on behalf of Party B for the Guest Data submitted through the Platform."));
children.push(subClause("9.2  Party A shall not share, sell, or otherwise disclose Party B\'s operational data or Guest Data to any third party, except: (a) as required by the Regulatory Authority or other government bodies with lawful authority; (b) to comply with a court order, subpoena, or legal process; or (c) with the prior written consent of Party B."));
children.push(subClause("9.3  Party A may collect and analyze anonymized, aggregated usage data from the Platform for the purpose of improving services, generating operational reports for the Regulatory Authority, and detecting suspicious patterns such as unusually frequent guest stays, provided that such analysis does not identify individual guests or establishments without proper legal basis."));
children.push(subClause("9.4  Party B shall ensure that all Guest Data collected and entered into the Platform is obtained lawfully and with the knowledge of the guests concerned. Party B shall be responsible for complying with any guest notification or consent requirements under applicable privacy laws."));

// --- Article 10: Liability for Breach ---
children.push(articleHeading("Article 10  Liability for Breach"));
children.push(subClause("10.1  If Party A fails to maintain the Platform\'s availability at the minimum level specified in Article 2.2 for two (2) or more calendar months within any Subscription Cycle, Party B shall be entitled to a proportional credit toward the next Subscription Cycle, calculated as a percentage of the fee corresponding to the duration of the outage."));
children.push(subClause("10.2  If Party B breaches any material provision of this Agreement, Party A shall provide written notice specifying the nature of the breach. Party B shall have fifteen (15) calendar days to cure the breach. If Party B fails to cure the breach within the specified period, Party A may suspend or terminate this Agreement in accordance with Article 8."));
children.push(subClause("10.3  Neither party shall be liable to the other for any indirect, incidental, consequential, special, or punitive damages arising out of or in connection with this Agreement, regardless of whether such damages were foreseeable or whether either party was advised of the possibility of such damages."));
children.push(subClause("10.4  The total aggregate liability of either party under this Agreement shall not exceed the total subscription fees paid or payable by Party B during the twelve (12) month period immediately preceding the event giving rise to the claim."));

// --- Article 11: Force Majeure ---
children.push(articleHeading("Article 11  Force Majeure"));
children.push(subClause("11.1  Neither party shall be liable for any failure or delay in the performance of its obligations under this Agreement to the extent that such failure or delay is caused by circumstances beyond the reasonable control of the affected party, including but not limited to: natural disasters, epidemics, pandemics, government actions, war, terrorism, civil unrest, power outages, internet service disruptions, or cyberattacks targeting critical infrastructure."));
children.push(subClause("11.2  The party affected by a force majeure event shall provide written notice to the other party within five (5) calendar days of becoming aware of the event. The notice shall describe the nature of the event, the expected duration of its impact, and the obligations affected."));
children.push(subClause("11.3  If a force majeure event continues for a period exceeding sixty (60) consecutive calendar days, either party may terminate this Agreement upon fifteen (15) calendar days\' written notice to the other party, without liability for such termination."));

// --- Article 12: Intellectual Property ---
children.push(articleHeading("Article 12  Intellectual Property"));
children.push(subClause("12.1  All intellectual property rights in the Platform, including but not limited to software code, database structure, user interface design, documentation, trademarks, and logos, shall remain the sole and exclusive property of Party A. Nothing in this Agreement shall be construed as granting Party B any ownership interest in the Platform or its intellectual property."));
children.push(subClause("12.2  Party B retains all ownership rights in the Establishment\'s operational data, including Guest Data, that is entered into the Platform. Party B grants Party A a limited, non-exclusive, non-transferable license to process, store, and use such data solely for the purpose of providing the Platform services under this Agreement."));
children.push(subClause("12.3  Party B shall not remove, alter, or obscure any proprietary notices, trademarks, or copyright markings displayed on or within the Platform."));

// --- Article 13: Confidentiality ---
children.push(articleHeading("Article 13  Confidentiality"));
children.push(subClause("13.1  Each party agrees to maintain in strict confidence all confidential information received from the other party in connection with this Agreement. Confidential information includes, but is not limited to: business operations, financial data, technical specifications, user data, and the terms of this Agreement."));
children.push(subClause("13.2  The confidentiality obligations under this Article shall not apply to information that: (a) is or becomes publicly available through no fault of the receiving party; (b) was already in the possession of the receiving party before disclosure; (c) is independently developed by the receiving party without reference to the confidential information; or (d) is rightfully received from a third party without restriction on disclosure."));
children.push(subClause("13.3  The confidentiality obligations shall survive the termination or expiration of this Agreement for a period of three (3) years."));

// --- Article 14: Dispute Resolution ---
children.push(articleHeading("Article 14  Dispute Resolution"));
children.push(subClause("14.1  The parties shall attempt to resolve any dispute arising out of or in connection with this Agreement through good-faith negotiation. Either party may initiate the negotiation process by providing written notice to the other party describing the nature of the dispute."));
children.push(subClause("14.2  If the dispute cannot be resolved through negotiation within thirty (30) calendar days of the initial notice, either party may submit the dispute to mediation administered by a mutually agreed-upon mediator. The costs of mediation shall be shared equally between the parties."));
children.push(subClause("14.3  If mediation fails to resolve the dispute within sixty (60) calendar days, either party may refer the dispute to the competent courts of 【Please fill in: Jurisdiction】, which shall have exclusive jurisdiction over any such dispute."));

// --- Article 15: Notices and Service ---
children.push(articleHeading("Article 15  Notices and Service"));
children.push(subClause("15.1  All notices, requests, demands, and other communications required or permitted under this Agreement shall be in writing and shall be deemed duly given when: (a) delivered personally; (b) sent by registered mail or courier and receipt is confirmed; (c) transmitted by email with confirmation of receipt; or (d) sent through the Platform\'s internal notification system and recorded as delivered."));
children.push(subClause("15.2  Notices shall be addressed to the parties at the addresses specified in the party information section of this Agreement, or at such other address as either party may designate by written notice to the other party."));

// --- Article 16: Miscellaneous ---
children.push(articleHeading("Article 16  Miscellaneous"));
children.push(subClause("16.1  Entire Agreement: This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior or contemporaneous agreements, representations, and understandings, whether oral or written."));
children.push(subClause("16.2  Amendment: No amendment or modification of this Agreement shall be valid unless made in writing and signed by both parties."));
children.push(subClause("16.3  Waiver: The failure of either party to enforce any provision of this Agreement shall not constitute a waiver of that party\'s right to enforce that provision or any other provision in the future."));
children.push(subClause("16.4  Severability: If any provision of this Agreement is held to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect."));
children.push(subClause("16.5  Assignment: Party B shall not assign, transfer, or sublicense this Agreement or any rights or obligations hereunder without the prior written consent of Party A. Party A may assign this Agreement to any successor entity without the consent of Party B, provided that the assignee assumes all of Party A\'s obligations under this Agreement."));
children.push(subClause("16.6  Governing Law: This Agreement shall be governed by and construed in accordance with the laws of 【Please fill in: Applicable Jurisdiction】."));
children.push(subClause("16.7  Counterparts: This Agreement may be executed in two or more counterparts, each of which shall be deemed an original, and all of which together shall constitute one and the same instrument."));

// --- Signature Block ---
children.push(
  new Paragraph({ spacing: { before: 600, after: 200, line: LINE_SPACING }, children: [] })
);
children.push(
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 300, line: LINE_SPACING },
    children: [
      new TextRun({
        text: "IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.",
        size: 24,
        font: BODY_FONT,
        color: "000000",
      }),
    ],
  })
);

const sigBlock = buildSignatureBlock(
  ["【Please fill in: Party A full name】", "【Please fill in】", "【Please fill in】", "【Please fill in】", "【Please fill in】", "【____/____/____】"],
  ["【Please fill in: Party B full name】", "【Please fill in】", "【Please fill in】", "【Please fill in】", "【Please fill in】", "【____/____/____】"]
);
children.push(sigBlock);

// === BUILD DOCUMENT ===
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: { ascii: BODY_FONT, eastAsia: "SimSun" },
          size: BODY_SIZE,
          color: "000000",
        },
        paragraph: {
          spacing: { line: LINE_SPACING },
        },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 18,
                  font: BODY_FONT,
                  color: "000000",
                }),
              ],
            }),
          ],
        }),
      },
      children: children,
    },
  ],
});

// === EXPORT ===
const OUTPUT_PATH = "/home/z/my-project/download/Guest_House_Registration_Time_Use_Agreement.docx";
Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUTPUT_PATH, buf);
  console.log(`Document saved to: ${OUTPUT_PATH}`);
});
