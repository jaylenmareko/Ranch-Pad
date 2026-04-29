const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({
        text: "Touchstone 2: Did Jim and Laura Buy a Car?",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ text: "Student: Jaylen Davis", alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "Course: Business Law", alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "" }),

      // PART 1
      new Paragraph({ text: "Part 1: Contract Definition", heading: HeadingLevel.HEADING_2 }),
      new Paragraph({
        children: [
          new TextRun({
            text: "A legally enforceable contract requires five essential elements: offer, acceptance, consideration, capacity, and legality. Each element must be present for a contract to be valid and binding.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: "1. Offer: ", bold: true }),
          new TextRun({
            text: "An offer is a definite, specific proposal made by one party (the offeror) to another (the offeree), expressing a willingness to enter into a contract on certain terms. For example, a car dealership posts a vehicle for sale at $25,000 — this constitutes an offer. The offer must be clear enough that a reasonable person understands what is being proposed.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: "2. Acceptance: ", bold: true }),
          new TextRun({
            text: "Acceptance is the offeree's unambiguous agreement to all the terms of the offer — often referred to as the \"mirror image\" rule. For example, if a buyer responds to the dealership's offer by saying \"I agree to purchase the car for $25,000,\" that constitutes acceptance. Any counter-offer or conditional response is not valid acceptance.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: "3. Consideration: ", bold: true }),
          new TextRun({
            text: "Consideration is something of legal value exchanged between the parties. It can be a payment, a promise to perform an act, or a promise to refrain from doing something. For example, the buyer promises to pay $25,000 and the dealership promises to transfer ownership of the vehicle. Both parties give and receive something of value.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: "4. Capacity: ", bold: true }),
          new TextRun({
            text: "Both parties must have the legal ability to enter into a contract. This means they must be of legal age (at least 18 in most states), of sound mind, and not under duress or undue influence. For example, a contract entered into by a minor or someone who is intoxicated may be voidable.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: "5. Legality: ", bold: true }),
          new TextRun({
            text: "The subject matter of the contract must be legal. A contract for an illegal purpose — such as an agreement to sell stolen property — is void and unenforceable. For example, a standard vehicle purchase agreement for a lawfully titled automobile satisfies the legality requirement.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),

      // PART 2
      new Paragraph({ text: "Part 2: Case Support", heading: HeadingLevel.HEADING_2 }),
      new Paragraph({
        children: [
          new TextRun({
            text: "The following facts from the Jim and Laura Buyer scenario are relevant to determining whether a contract was formed:",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: "Offer: ", bold: true }),
          new TextRun({
            text: "Stan Salesman showed Jim and Laura several vehicles and they test-drove cars. While Jim and Laura showed interest in the blue 4-door sedan, there is no evidence that Stan made a definite offer with specific purchase terms (price, financing, delivery date) that Jim and Laura accepted. The parties had not yet agreed on the material terms of a purchase.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: "Acceptance: ", bold: true }),
          new TextRun({
            text: "Jim and Laura gave Stan a $100.00 deposit to \"hold\" the car for one day. This action indicates interest in the car, but does not constitute clear, unambiguous acceptance of an offer to purchase. The parties had not agreed on the full purchase price, financing terms, or any other material contractual terms.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: "Consideration: ", bold: true }),
          new TextRun({
            text: "The $100.00 deposit was given by Jim and Laura to hold the car. However, Stan explicitly stated the deposit was refundable, which significantly undermines its value as binding consideration for a purchase contract. A refundable deposit does not create a firm obligation to buy.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: "Statute of Frauds: ", bold: true }),
          new TextRun({
            text: "An automobile purchase is a contract for the sale of goods exceeding $500 in value. Under the Uniform Commercial Code (UCC) and the Statute of Frauds, such contracts must be in writing and signed by the parties to be enforceable (Cheeseman, 2016). No documents were signed in this scenario, meaning even if an oral agreement existed, it would not be enforceable.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({ text: "No Written Contract: ", bold: true }),
          new TextRun({
            text: "Stan Salesman did not provide Jim and Laura with a receipt, and no documents of any kind were signed. The absence of any written agreement is critical, especially for a major purchase like an automobile.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),

      // PART 3
      new Paragraph({ text: "Part 3: Case Judgment", heading: HeadingLevel.HEADING_2 }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Based on the facts presented in Part 2, it is my judgment that ",
          }),
          new TextRun({ text: "Jim and Laura did not form a legally binding contract", bold: true }),
          new TextRun({
            text: " to purchase the automobile from Stan Salesman. My reasoning is as follows:",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({
            text: "First, there was no definite offer or clear acceptance of specific purchase terms. The parties discussed vehicles and Jim and Laura expressed interest, but they never agreed to buy the car at a specific price or on specific terms. Without a meeting of the minds on material terms, no offer and acceptance existed (Miller & Cross, 2018).",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Second, the $100.00 deposit cannot establish a binding contract because Stan said it was refundable, and no purchase agreement was memorialized in writing. A refundable deposit is not the kind of firm, bargained-for consideration needed to bind a party to a purchase.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Third, the Statute of Frauds requires that contracts for the sale of goods over $500 must be in writing. Since no documents were signed, any purported oral agreement to purchase the automobile is unenforceable as a matter of law.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Therefore, Jim and Laura are entitled to the return of their $100.00 deposit, as no binding contract for the purchase of the automobile was ever formed. Stan Salesman's insistence that the deposit constituted a contract is legally unsupported.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),

      // PART 4
      new Paragraph({ text: "Part 4: Sources & Conventions", heading: HeadingLevel.HEADING_2 }),
      new Paragraph({
        children: [
          new TextRun({
            text: "The following academic sources were used to support the analysis in this Touchstone:",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Cheeseman, H. R. (2016). ",
          }),
          new TextRun({
            text: "Business law: Legal environment, online commerce, business ethics, and international issues",
            italics: true,
          }),
          new TextRun({
            text: " (9th ed.). Pearson. This textbook was used to support the discussion of the Statute of Frauds in Part 2. Cheeseman explains that contracts for the sale of goods over $500 must be in writing under UCC § 2-201, making an oral agreement to purchase an automobile unenforceable.",
          }),
        ],
      }),
      new Paragraph({ text: "" }),
      new Paragraph({
        children: [
          new TextRun({
            text: "Miller, R. L., & Cross, F. B. (2018). ",
          }),
          new TextRun({
            text: "The legal environment of business: Text and cases",
            italics: true,
          }),
          new TextRun({
            text: " (10th ed.). Cengage Learning. This source was used to support the discussion of offer, acceptance, and the meeting of the minds in Parts 2 and 3. Miller and Cross outline that all essential elements — including a definite offer, unequivocal acceptance, and consideration — must be present for a valid contract to exist.",
          }),
        ],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('touchstone2_completed.docx', buffer);
  console.log('Document created: touchstone2_completed.docx');
});
