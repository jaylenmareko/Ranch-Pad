const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = require('docx');
const fs = require('fs');
const path = require('path');

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      // Title
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Touchstone 2: Managing Organizational Conflict', bold: true, size: 28 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Student: Jaylen Davis', size: 24 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: 'Course: Business Communication', size: 24 })]
      }),
      new Paragraph({ children: [new TextRun({ text: '' })] }),

      // Q1
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'Question 1', bold: true })]
      }),
      new Paragraph({
        children: [new TextRun({
          text: 'The best decision-making approach for determining whether the tracking system should remain in place is collaborative consensus-building, which is rooted in the building goodwill principles covered in the course tutorials. Rather than allowing the executive to make another unilateral choice about the system, this approach brings together executives, managers, and customer service associates in a structured process where every stakeholder can voice concerns and contribute to the outcome. This method is most appropriate here because the original unilateral rollout of the tracking system is the root cause of the current morale crisis — repeating that pattern would likely deepen resentment rather than resolve it. Collaborative decision-making also signals to associates that their perspective has organizational value, which is essential for rebuilding the trust that has been eroded over these past months. When employees have a hand in shaping a decision, they are far more likely to embrace and sustain it, whether the tracking system is ultimately kept, modified, or removed entirely. This approach also allows the organization to gather ground-level data about how the system actually affects daily workflow, information the executive lacked when she first implemented it. Ultimately, a consensus-based process addresses both the immediate policy dispute and the deeper issue of how decisions should be made within this organization going forward.'
        })]
      }),
      new Paragraph({ children: [new TextRun({ text: '' })] }),

      // Q2
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'Question 2', bold: true })]
      }),
      new Paragraph({
        children: [new TextRun({
          text: 'For the executives and managers, I would advise them to open the meeting by explicitly acknowledging that the tracking system rollout caused unintended harm, demonstrating accountability rather than defensiveness from the start. They should use open-ended questions to invite associates to share their experiences, and practice active listening by avoiding interruptions and genuinely considering feedback before responding. It is also important for managers to make clear from the outset that the meeting\'s purpose is collaborative problem-solving — not defending the existing system — which sets a tone of psychological safety that encourages honest participation from everyone in the room. For the customer service associates, I would encourage them to come prepared with specific, concrete examples of how the tracking system has affected their ability to do their jobs effectively, so that their feedback is constructive and grounded in evidence rather than general frustration. Associates should also approach the meeting with an open mind, recognizing that the executive\'s original goal of improving productivity was a legitimate business objective, even if the implementation was mishandled. Both groups should agree at the outset to a set of ground rules — such as one speaker at a time and no dismissing others\' experiences — to keep the discussion respectful and on track. This kind of structured, empathetic meeting format creates the conditions necessary for genuine consensus rather than surface-level compliance.'
        })]
      }),
      new Paragraph({ children: [new TextRun({ text: '' })] }),

      // Q3
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'Question 3', bold: true })]
      }),
      new Paragraph({
        children: [new TextRun({
          text: 'To ensure the meeting is inclusive and equitable for native speakers of Spanish, Russian, and other languages, the meeting agenda and any supporting documents about the tracking system should be translated into the primary languages represented in the workforce before the meeting takes place. During the meeting, the facilitator should speak at a measured pace, avoid idiomatic phrases that do not translate easily, and pause regularly to check for understanding across all language groups. Where resources allow, bilingual colleagues or professional interpreters should be present to provide real-time translation, ensuring that no associate is excluded from the conversation simply because of a language barrier. Drawing on the course tutorials about communicating in a diverse workplace, the facilitator should also be intentional about not inadvertently grouping or seating employees by language in ways that could signal separation or exclusion within the team. Associates who are less comfortable speaking English in a group setting should be given a written option — such as an anonymous comment form available in their native language — so they can contribute feedback without the added pressure of performing in a second language. At the start of the meeting, the facilitator should explicitly affirm that linguistic and cultural diversity is a strength of this team, not an obstacle to be worked around. Taking these steps ensures that the final decision reflects the voices and needs of the entire workforce, not just those most comfortable communicating in English.'
        })]
      }),
      new Paragraph({ children: [new TextRun({ text: '' })] }),

      // Q4
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: 'Question 4', bold: true })]
      }),
      new Paragraph({
        children: [new TextRun({
          text: 'Although the conflict surrounding the tracking system has been disruptive, it presents a meaningful opportunity for the organization to improve its internal processes and long-term performance. One clear benefit is the likely development of a more inclusive protocol for implementing future policy changes, so that new initiatives are tested with frontline input before full rollout — a safeguard that was absent when the executive first introduced the time-tracking system. The associates\' specific grievance that the system itself consumed productive work time surfaced a genuine operational inefficiency that leadership had not accounted for, making it possible to redesign or replace the tool with something less burdensome and more effective. Consistent with the course tutorials on building goodwill, conflict that is handled constructively tends to produce stronger communication channels, clearer role expectations, and greater trust between leadership and staff over time. The process of working through this particular dispute can also serve as a model for future disagreements, establishing shared norms around respectful dialogue and collaborative problem-solving that the organization can return to whenever new conflicts arise. Research and professional practice consistently show that organizations with healthy conflict-management cultures experience better employee retention, because people feel valued and heard even in difficult situations rather than overruled. In this case, resolving the tracking system conflict thoughtfully could yield not just a more effective productivity measurement tool, but a more cohesive, engaged, and resilient team capable of navigating future challenges together.'
        })]
      }),
    ]
  }]
});

const outPath = path.join(__dirname, 'touchstone2_buscomm.docx');
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log('Written:', outPath);
});
