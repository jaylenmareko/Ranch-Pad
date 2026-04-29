const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = require('docx');
const fs = require('fs');
const path = require('path');

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({
        text: "Touchstone 3.1: Sending Good News and Bad News",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: "Student: Jaylen Davis", alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "Course: Business Communication", alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "Scenario: Office Relocation", alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "" }),

      // Subject line
      new Paragraph({
        children: [
          new TextRun({ text: "Subject: ", bold: true }),
          new TextRun({ text: "Our Office is Moving to 1010 Mill Road — Important Dates and Details" }),
        ],
      }),
      new Paragraph({ text: "" }),

      // Greeting
      new Paragraph({ text: "Dear Team," }),
      new Paragraph({ text: "" }),

      // Opening
      new Paragraph({
        children: [
          new TextRun({
            text: "I am writing to share some important news about an upcoming change to our workplace. We will be relocating our office to a new location this spring, and while this move brings real improvements that many of you have asked for, it also comes with one significant change to how our workspace will be organized that I want you to hear directly from me.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),

      // Body paragraph 1 — Good news
      new Paragraph({
        children: [
          new TextRun({
            text: "I am pleased to announce that we will be moving to our new office at 1010 Mill Road between April 15 and April 19. For years, many of you have raised concerns about the cramped spaces, unreliable heating and air conditioning, and the frustrating shortage of parking at our current location — the new building addresses all of it. The new facility offers ample workspace throughout, a fully updated and reliable HVAC system, and plenty of parking for the entire staff. Professional movers will manage the entire transition, so you will not need to handle any equipment or office furniture yourself. The only thing required of you before the move begins is to remove all personal belongings from your workspace by end of day on April 14.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),

      // Body paragraph 2 — Bad news
      new Paragraph({
        children: [
          new TextRun({
            text: "There is one aspect of the new location I want to address openly, because I know it will be an adjustment. At 1010 Mill Road, all but the most senior staff members will be working in an open, shared workspace rather than private offices. I understand that private offices have been a part of how most of us work here for a long time, and I want to acknowledge that this is a real change. The decision was made carefully and was not taken lightly. We are committed to designing the shared space thoughtfully and making it as comfortable and functional as possible for everyone. We will be gathering your input as we finalize the layout, and I encourage you to share your ideas.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),

      // Closing
      new Paragraph({
        children: [
          new TextRun({
            text: "Please make note of the move window — April 15 through 19 — and make sure your personal items are cleared out before April 14. Do not hesitate to reach out if you have questions in the meantime.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),

      // Sign-off
      new Paragraph({ text: "Sincerely," }),
      new Paragraph({ text: "Jaylen Davis" }),
    ],
  }],
});

const outPath = path.join(__dirname, 'touchstone3_1_completed.docx');
Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outPath, buffer);
  console.log('Document created:', outPath);
});
