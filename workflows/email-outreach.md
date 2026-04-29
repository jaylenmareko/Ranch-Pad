# Email Outreach

## Purpose
Send a cold email campaign to a scraped or curated contact list.

**Email provider:** Resend (`resend` npm package)
**Per-project config:** Each project has its own `email-outreach.md` in its folder with project-specific details. This file is the overseer — follow these steps for every campaign.

## Inputs
- Contact list (Google Sheet, CSV, or array in send script)
- Email copy (subject + body)
- Project config file (see project folder)
- Verified sender domain in Resend (resend.com/domains)

## Steps

### 1. Check project config
- Open the project's `email-outreach.md` (e.g. `projects/business/TopicLaunch/email-outreach.md`)
- Confirm: API key, from address, contacts source, and copy are all set

### 2. Dry run
```bash
node send-emails.mjs --dry-run
```
- Logs recipients to console without sending
- Verify cleaned email list looks right before sending for real

### 3. Send
```bash
node send-emails.mjs
```
- Script cleans + deduplicates emails automatically
- Sends with 200ms delay between each to avoid spam flags
- Logs each send result to console and `sent_log.txt`

### 4. Log results
- Save `sent_log.txt` to the project's outreach folder with a date-stamped name
  - e.g. `projects/business/Ranch-Pad/outreach/24-04-2026-ffa-sent.txt`

## Outputs
- `sent_log.txt` — record of every send attempt and result

## Notes
- Keep batches under 100/day on free Resend plan
- Sender domain must be verified in Resend or all sends fail
- Always check `sent_log.txt` after a run to catch hard bounces
- Each project's send script lives in its project folder, not root
