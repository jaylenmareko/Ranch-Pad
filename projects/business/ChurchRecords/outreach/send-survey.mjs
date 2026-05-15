const RESEND_API_KEY = 're_dMHzfeWu_Cc6a4nX2Kgs9Hn4UhGbDpyAU';
const FROM = 'Jaylen Davis <jaylen@ranchpad.app>';
const SUBJECT = 'Quick question about how your church keeps records';

const BODY = `I'm working on a tool to make record keeping easier and more affordable for churches — but before I build it, I want to make sure it solves a real problem. I'm a member at Peoples Community Christian Church in St. Louis, MO and I'm researching how churches manage their records — membership, attendance, baptisms, and finances.

11 questions, under 5 minutes:
https://forms.gle/7XjffqMW3qvR8Yau9

Your answers directly shape what gets built.

— Jaylen Davis`;

const contacts = [
  { name: 'Rolling Hills Community Church',         email: 'rollinghillschurchwichita@gmail.com' },
  { name: 'Wichita Bible Church',                   email: 'wichitabible@gmail.com' },
  { name: 'Wichita United Church of Christ',        email: 'admin@wichitaucc.org' },
  { name: 'Central Christian Church',               email: 'socialmedia@ccc.org' },
  { name: 'Church of the Savior',                   email: 'office@cotsks.com' },
  { name: 'Ridgepoint Church',                      email: 'hello@ridgepointwichita.com' },
  { name: 'Faith Community Church',                 email: 'office@fccwichita.org' },
  { name: 'New Life Covenant Church',               email: 'info@newlifecovenant.org' },
  { name: 'Temple Baptist Church',                  email: 'tbcwichita@gmail.com' },
  { name: 'Immanuel Baptist Church',                email: 'info@ibcwichita.com' },
  { name: 'Wichita Community Baptist Church',       email: 'sisteryoung@wichitacbc.com' },
  { name: 'Cross Point Free Will Baptist',          email: 'crosspointfreewill@gmail.com' },
  { name: 'Heritage Family Church',                 email: 'hfcwichita@gmail.com' },
  { name: 'City Life Church',                       email: 'connect@citylifechurch.org' },
  { name: 'South City Church',                      email: 'info@southcitychurch.com' },
  { name: 'Shalom Church',                          email: 'office@shalomccop.org' },
  { name: 'St. Louis Family Church',                email: 'info@slfc.org' },
  { name: 'West Hills Church',                      email: 'info@westhillsstl.org' },
  { name: 'Gateway City Church',                    email: 'admin@gatewaycitychurch.com' },
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
  console.log(`Sending to ${contacts.length} churches...\n`);
  for (const contact of contacts) {
    await sendEmail(contact);
    await sleep(500); // avoid rate limits
  }
  console.log('\nDone.');
}

main();
