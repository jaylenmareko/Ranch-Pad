const RESEND_API_KEY = 're_dMHzfeWu_Cc6a4nX2Kgs9Hn4UhGbDpyAU';
const FROM = 'Jaylen Davis <jaylen@ranchpad.app>';
const SUBJECT = 'Quick question about how your church keeps records';

const BODY = `I'm working on a tool to make record keeping easier and more affordable for churches — but before I build it, I want to make sure it solves a real problem. I'm a member at Peoples Community Christian Church in St. Louis, MO and I'm researching how churches manage their records — membership, attendance, baptisms, and finances.

11 questions, under 5 minutes:
https://forms.gle/7XjffqMW3qvR8Yau9

Your answers directly shape what gets built.

— Jaylen Davis`;

const contacts = [
  { name: 'Evangel Assembly of God',           email: 'eaginfo@evangelwichita.org' },
  { name: 'Greater Pentecostal COGIC',          email: 'admin@gpcogic.org' },
  { name: 'Aldersgate United Methodist',        email: 'admin@aldersgatechurch.org' },
  { name: 'East Point Church of Christ',        email: 'office@epcofc.org' },
  { name: 'West Evangelical Free Church',       email: 'info@westefc.org' },
  { name: 'Wichita First Church of Nazarene',   email: 'hello@firstnaz.org' },
  { name: 'New Life Community COGIC',           email: 'tjsmithlaw@yahoo.com' },
  { name: 'The Rock Church',                    email: 'amy@therockstl.com' },
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function sendEmail(contact) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [contact.email],
      subject: SUBJECT,
      text: BODY,
    }),
  });

  const data = await res.json();
  if (res.ok) {
    console.log(`✓ Sent to ${contact.name} <${contact.email}>`);
  } else {
    console.error(`✗ Failed: ${contact.name} — ${JSON.stringify(data)}`);
  }
}

async function main() {
  console.log(`Sending wave 2 — ${contacts.length} churches...\n`);
  for (const contact of contacts) {
    await sendEmail(contact);
    await sleep(500);
  }
  console.log('\nDone.');
}

main();
