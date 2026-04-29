const {
  Document, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Packer, BorderStyle, Table, TableRow, TableCell, WidthType,
  ShadingType, convertInchesToTwip
} = require('docx');
const fs = require('fs');
const path = require('path');

// Helper: bold centered heading
function sectionHeader(text) {
  return new Paragraph({
    children: [
      new TextRun({ text, bold: true, size: 22 }),
    ],
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '333333' },
    },
    spacing: { before: 160, after: 60 },
  });
}

// Helper: job entry heading line
function jobTitle(title, company, dates) {
  return new Paragraph({
    children: [
      new TextRun({ text: title, bold: true, size: 20 }),
      new TextRun({ text: '  |  ', size: 20 }),
      new TextRun({ text: company, italics: true, size: 20 }),
      new TextRun({ text: '  |  ', size: 20 }),
      new TextRun({ text: dates, size: 20 }),
    ],
    spacing: { before: 80, after: 40 },
  });
}

// Helper: bullet point
function bullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20 })],
    bullet: { level: 0 },
    spacing: { before: 20, after: 20 },
  });
}

// Helper: plain paragraph
function plain(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, ...opts })],
    spacing: { before: 40, after: 40 },
  });
}

const doc = new Document({
  sections: [{
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(0.6),
          bottom: convertInchesToTwip(0.6),
          left: convertInchesToTwip(0.75),
          right: convertInchesToTwip(0.75),
        },
      },
    },
    children: [

      // ── NAME & CONTACT ──────────────────────────────────────────────
      new Paragraph({
        children: [new TextRun({ text: 'JAYLEN DAVIS', bold: true, size: 32 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'jaylen@ranchpad.app  |  Winfield, KS  |  github.com/jaylenmareko', size: 20 }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),

      // ── PROFESSIONAL OBJECTIVE ──────────────────────────────────────
      sectionHeader('PROFESSIONAL OBJECTIVE'),
      plain(
        'Business student and software entrepreneur seeking to apply technical and entrepreneurial skills in a professional setting. ' +
        'Experienced in building full-stack web applications and bringing products from concept to market. ' +
        'Committed to delivering practical, user-focused solutions in business and technology environments.'
      ),

      // ── WORK HISTORY ────────────────────────────────────────────────
      sectionHeader('WORK HISTORY'),

      jobTitle('Founder & Full-Stack Developer', 'RanchPad', '2024 – Present'),
      bullet('Designed and launched a subscription-based livestock management platform serving ranchers and farmers across the Midwest, generating recurring monthly revenue.'),
      bullet('Built the full application stack using React, Vite, Express.js, and PostgreSQL, integrating Stripe for payment processing and the Claude API for AI-powered features.'),
      bullet('Developed and executed go-to-market strategy targeting FFA instructors and regional farm bureau contacts to drive early user acquisition.'),
      bullet('Managed all product, engineering, and marketing decisions independently, reducing time-to-market by planning sprints and prioritizing revenue-driving features first.'),

      new Paragraph({ spacing: { before: 80 } }),

      jobTitle('Independent Software Developer', 'Freelance', '2023 – Present'),
      bullet('Conceptualized and developed multiple software products across diverse markets, including AI-assisted tools, a beef marbling grading app, and a fan-to-creator marketplace.'),
      bullet('Integrated machine learning APIs and computer vision models to build data-driven mobile and web applications.'),
      bullet('Applied business communication and project management skills to scope, design, and deliver functional prototypes on tight timelines.'),

      // ── EDUCATION ───────────────────────────────────────────────────
      sectionHeader('EDUCATION'),

      jobTitle('Bachelor of Business Administration (In Progress)', 'Southwestern College', 'Winfield, KS | Expected 2026'),
      bullet('Relevant coursework: Business Law, Business Communication, Human Resource Management, Business Ethics, Personal Finance, Principles of Finance, Financial Accounting.'),
      bullet('Applying classroom knowledge directly to the operation and growth of an active software business.'),

      // ── TECHNICAL SKILLS ────────────────────────────────────────────
      sectionHeader('TECHNICAL SKILLS'),
      plain('Languages & Frameworks:  JavaScript, TypeScript, React, React Native, Node.js, Express.js, Expo'),
      plain('Databases & Services:  PostgreSQL, Supabase, Stripe, Claude API, Roboflow'),
      plain('Tools:  Git, GitHub, Vite, Playwright, VS Code, Cursor'),

    ],
  }],
});

const outPath = path.join(__dirname, 'jaylen_davis_resume.docx');
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log('Resume created:', outPath);
});
