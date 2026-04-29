import { Document, Paragraph, TextRun, AlignmentType, Packer } from 'docx';
import { writeFileSync } from 'fs';

const font = 'Times New Roman';
const sz = 24; // 12pt

const p = (text, opts = {}) => new Paragraph({
  alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
  spacing: { line: 276 },
  children: [new TextRun({ text, font, size: sz, bold: opts.bold ?? false })]
});

const blank = () => p('');

const label = (text) => new Paragraph({
  spacing: { line: 276 },
  children: [new TextRun({ text, font, size: sz, bold: true })]
});

const item = (text) => new Paragraph({
  spacing: { line: 276 },
  indent: { left: 360 },
  children: [new TextRun({ text: `• ${text}`, font, size: sz })]
});

const doc = new Document({
  sections: [{
    properties: {
      page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    children: [

      p('Name: Jaylen Davis', { bold: false }),
      p('Date: April 24, 2026', { bold: false }),
      blank(),

      label('Organizing Your Financial Information'),
      blank(),

      // ---- MONTHLY INCOME ----
      label('Monthly Income'),
      blank(),
      p('Sources of income:'),
      item('Part-time wages (campus/local work): $1,300'),
      item('RanchPad app subscription revenue: $200'),
      blank(),
      p('Monthly after-tax income: $1,500'),
      blank(),

      // ---- FIXED EXPENSES ----
      label('Fixed Expenses'),
      blank(),
      p('Fixed expenses:'),
      item('Rent: $600'),
      item('Cell phone plan: $55'),
      item('Auto insurance: $80'),
      item('Student loan minimum payment: $135'),
      blank(),
      p('Total monthly fixed expenses: $870'),
      blank(),

      // ---- VARIABLE EXPENSES ----
      label('Variable Expenses'),
      blank(),
      p('Variable expenses:'),
      item('Groceries: $220'),
      item('Gasoline: $80'),
      item('Dining out: $90'),
      item('Entertainment and streaming subscriptions: $50'),
      item('Clothing and personal care: $40'),
      blank(),
      p('Total monthly variable expenses: $480'),
      blank(),

      // ---- ASSETS ----
      label('Assets'),
      blank(),
      p('Assets:'),
      item('Checking account balance: $650'),
      item('Savings account balance: $450'),
      item('Vehicle — 2014 Honda Civic: $6,500'),
      item('Laptop and tech equipment: $1,000'),
      item('Business assets (RanchPad software and domain): $500'),
      blank(),
      p('Total assets: $9,100'),
      blank(),

      // ---- LIABILITIES ----
      label('Liabilities'),
      blank(),
      p('Liabilities:'),
      item('Student loan balance: $9,200'),
      item('Credit card balance: $280'),
      item('Personal loan (family): $1,170'),
      blank(),
      p('Total liabilities: $10,650'),

    ]
  }]
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('./projects/school/sophia-learning/personal-finance/touchstone-task-1/pf_touchstone_task1.docx', buffer);
console.log('Done: pf_touchstone_task1.docx created');
