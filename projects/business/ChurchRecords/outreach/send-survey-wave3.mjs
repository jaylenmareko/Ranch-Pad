const RESEND_API_KEY = 're_dMHzfeWu_Cc6a4nX2Kgs9Hn4UhGbDpyAU';
const FROM = 'Jaylen Davis <jaylen@ranchpad.app>';
const SUBJECT = 'Quick question about how your church keeps records';

const BODY = `I'm working on a tool to make record keeping easier and more affordable for churches — but before I build it, I want to make sure it solves a real problem. I'm a member at Peoples Community Christian Church in St. Louis, MO and I'm researching how churches manage their records — membership, attendance, baptisms, and finances.

11 questions, under 5 minutes:
https://forms.gle/7XjffqMW3qvR8Yau9

Your answers directly shape what gets built.

— Jaylen Davis`;

const contacts = [
  { name: 'Tabernacle Bible Church',        email: 'info@tbcwichita.org' },
  { name: 'Cleveland Avenue Baptist Church',email: 'info@cabckc.org' },
  { name: 'Friendship Baptist Church KC',   email: 'info@fbckcmo.org' },
  { name: 'Greater Life Pentecostal Church',email: 'info@greaterlifekc.com' },
  { name: 'Evangel Church KC',              email: 'info@evangelkc.org' },
  { name: 'Metropolitan Baptist Church',    email: 'info@mbtkc.org' },
  { name: 'The Pentecostal Church KC',      email: 'tpckc73@gmail.com' },
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
  console.log(`Sending wave 3 — ${contacts.length} churches...\n`);
  for (const contact of contacts) {
    await sendEmail(contact);
    await sleep(500);
  }
  console.log('\nDone.');
}

main();
