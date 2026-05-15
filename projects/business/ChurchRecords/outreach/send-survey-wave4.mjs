const RESEND_API_KEY = 're_dMHzfeWu_Cc6a4nX2Kgs9Hn4UhGbDpyAU';
const FROM = 'Jaylen Davis <jaylen@ranchpad.app>';
const SUBJECT = 'Quick question about how your church keeps records';

const BODY = `I'm working on a tool to make record keeping easier and more affordable for churches — but before I build it, I want to make sure it solves a real problem. I'm a member at Peoples Community Christian Church in St. Louis, MO and I'm researching how churches manage their records — membership, attendance, baptisms, and finances.

11 questions, under 5 minutes:
https://forms.gle/7XjffqMW3qvR8Yau9

Your answers directly shape what gets built.

— Jaylen Davis`;

const contacts = [
  { name: 'Tulsa First Baptist Church',         email: 'info@tulsafbc.org' },
  { name: 'Tulsa Lighthouse Church',            email: 'info@tlctulsa.org' },
  { name: 'Peniel Baptist Church Tulsa',        email: 'info@pbctulsa.org' },
  { name: 'Southern Hills Baptist Tulsa',       email: 'info@shbctulsa.org' },
  { name: 'Eastland Baptist Tulsa',             email: 'eastland@ebctulsa.org' },
  { name: 'Boston Avenue UMC Tulsa',            email: 'welcome@bostonavenue.org' },
  { name: 'First Baptist OKC',                  email: 'info@fbcokc.org' },
  { name: 'New Beginning Worship Center OKC',   email: 'newbeginningphchurch@yahoo.com' },
  { name: 'Northeast Missionary Baptist OKC',   email: 'connect@nmbcok.org' },
  { name: 'Second Baptist Springfield',         email: 'info@secondbaptist.org' },
  { name: 'Berean Baptist Springfield',         email: 'info@bereansgf.org' },
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
  console.log(`Sending wave 4 — ${contacts.length} churches...\n`);
  for (const contact of contacts) {
    await sendEmail(contact);
    await sleep(500);
  }
  console.log('\nDone.');
}

main();
