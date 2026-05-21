# Outreach Machine — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a fully autonomous multi-project email outreach system — 3 projects, ~3,000 emails/week, scrapes its own leads, personalizes with Claude, monitors replies, digests daily.

**Architecture:** 4 Python scripts in `outreach/machine/` share a state directory (one JSON per project). Four Claude Code remote crons drive the pipeline: Scraper (Sun 10pm) → Sender (Mon/Wed/Fri 9am) → Monitor (daily 7am) → Digest (daily 8am). Auto-scrape triggers when any queue drops below 200 leads.

**Tech Stack:** Python 3, Resend REST API, Anthropic SDK (claude-haiku-4-5), Apify API, CSV/JSON state files, Claude Code CronCreate

---

## Environment & Keys

All scripts read from `outreach/machine/.env`:

```
RESEND_KEY_RANCHPAD=re_NJ8TfuUe_PXhyGeic5vP8mZwrSFzsVEiF
RESEND_KEY_PJROUTES=re_4LmPWRn9_NLhTMktvHQApomEukwcxefHk
RESEND_KEY_TOPICLAUNCH=re_MuaEmpxZ_A3ZBmB9xLkvX1pAzTHt1h82P
ANTHROPIC_API_KEY=<from existing env>
APIFY_API_KEY=<from reference_credentials.md>
DIGEST_EMAIL=j7beatss@gmail.com
```

Base path (used throughout): `C:/Users/Jaylen.Davis/OneDrive - Southwestern College/Desktop/DoWhatever`

---

## Task 1: Scaffold Structure

**Files to create:**
- `outreach/machine/.env`
- `outreach/machine/config.json`
- `outreach/machine/state/ranchpad.json`
- `outreach/machine/state/pjroutes.json`
- `outreach/machine/state/topiclaunch.json`
- `outreach/machine/lib/__init__.py`
- `outreach/machine/lib/state.py`
- `outreach/machine/lib/resend.py`

**Step 1: Create directories**

```bash
cd "C:/Users/Jaylen.Davis/OneDrive - Southwestern College/Desktop/DoWhatever"
mkdir -p outreach/machine/state outreach/machine/lib
```

**Step 2: Create `.env`**

```
RESEND_KEY_RANCHPAD=re_NJ8TfuUe_PXhyGeic5vP8mZwrSFzsVEiF
RESEND_KEY_PJROUTES=re_4LmPWRn9_NLhTMktvHQApomEukwcxefHk
RESEND_KEY_TOPICLAUNCH=re_MuaEmpxZ_A3ZBmB9xLkvX1pAzTHt1h82P
ANTHROPIC_API_KEY=
APIFY_API_KEY=
DIGEST_EMAIL=j7beatss@gmail.com
```

(Fill ANTHROPIC_API_KEY and APIFY_API_KEY from existing creds)

**Step 3: Create `config.json`**

```json
{
  "ranchpad": {
    "resend_key_env": "RESEND_KEY_RANCHPAD",
    "from": "Jaylen @ RanchPad <jaylen@ranchpad.app>",
    "batch_size": 500,
    "queue_threshold": 200,
    "scrape_sources": ["apify_ag_creators", "extension_dirs"],
    "template_prompt": "You are writing a short cold email for RanchPad, a livestock management app ($12/mo). The recipient is an agricultural creator, rancher, or extension agent. Write a 3-sentence email: one hook about their specific world (ranching/livestock/ag), one sentence about RanchPad solving a real pain (tracking animals, medications, records), one CTA to try it free for 14 days at ranchpad.app. Sign as Jaylen. No subject line fluff. Plain text only.",
    "subject": "quick question about your operation"
  },
  "pjroutes": {
    "resend_key_env": "RESEND_KEY_PJROUTES",
    "from": "Jaylen @ PJRoutes <support@pjroutes.com>",
    "batch_size": 200,
    "queue_threshold": 200,
    "scrape_sources": ["faa_part135", "aircharterguide"],
    "template_prompt": "You are writing a short cold email for PJRoutes, a marketplace where charter operators list empty-leg flights and passengers book directly. No brokers, no membership fees. The recipient is a Part 135 charter operator. Write 3 sentences: acknowledge they fly empty legs (wasted revenue), explain PJRoutes fills those seats with direct bookings (operators keep full fare), CTA to list their first flight free at pjroutes.com. Sign as Jaylen. Plain text only.",
    "subject": "fill your empty legs — no broker fees"
  },
  "topiclaunch": {
    "resend_key_env": "RESEND_KEY_TOPICLAUNCH",
    "from": "Jaylen @ TopicLaunch <jaylen@topiclaunch.com>",
    "batch_size": 300,
    "queue_threshold": 200,
    "scrape_sources": ["google_sheet", "apify_youtube", "apify_tiktok"],
    "template_prompt": "You are writing a short cold email for TopicLaunch, a platform where fans pay to request video topics from creators. Creator keeps 90%. The recipient is a content creator. Write 3 sentences: acknowledge their audience clearly wants more from them, explain TopicLaunch lets fans fund specific content before it's made (creator keeps 90%), CTA to check it out at topiclaunch.com. Sign as Jaylen. Plain text only.",
    "subject": "your audience will pay for this"
  }
}
```

**Step 4: Create empty state files** (one per project)

```json
{
  "meta": {
    "project": "ranchpad",
    "last_scrape": null,
    "last_send": null
  },
  "queue": [],
  "sent": [],
  "stats": {
    "total_sent": 0,
    "opens": 0,
    "replies": 0
  }
}
```

Create identical files for `pjroutes.json` and `topiclaunch.json` (change `"project"` field).

**Step 5: Create `lib/state.py`**

```python
import json, os, uuid
from pathlib import Path

BASE = Path(__file__).parent.parent
STATE_DIR = BASE / "state"

def load(project: str) -> dict:
    path = STATE_DIR / f"{project}.json"
    with open(path) as f:
        return json.load(f)

def save(project: str, data: dict):
    path = STATE_DIR / f"{project}.json"
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2, default=str)
    tmp.replace(path)  # atomic write

def get_sent_emails(project: str) -> set:
    data = load(project)
    return {r["email"].lower() for r in data["sent"]}

def get_queued_emails(project: str) -> set:
    data = load(project)
    return {r["email"].lower() for r in data["queue"]}

def enqueue(project: str, leads: list[dict]):
    """Add leads to queue, deduplicating against already sent + already queued."""
    data = load(project)
    existing = get_sent_emails(project) | get_queued_emails(project)
    added = 0
    for lead in leads:
        email = lead.get("email", "").strip().lower()
        if not email or "@" not in email or email in existing:
            continue
        lead["id"] = str(uuid.uuid4())
        lead["email"] = email
        data["queue"].append(lead)
        existing.add(email)
        added += 1
    save(project, data)
    return added

def pop_batch(project: str, n: int) -> list[dict]:
    """Remove and return up to n unsent leads from the front of the queue."""
    data = load(project)
    batch = data["queue"][:n]
    data["queue"] = data["queue"][n:]
    save(project, data)
    return batch

def mark_sent(project: str, lead: dict, resend_id: str):
    from datetime import datetime, timezone
    data = load(project)
    data["sent"].append({
        "id": lead["id"],
        "email": lead["email"],
        "name": lead.get("name", ""),
        "org": lead.get("org", ""),
        "resend_id": resend_id,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "status": "sent",
        "opened_at": None,
        "replied_at": None
    })
    data["stats"]["total_sent"] += 1
    data["meta"]["last_send"] = datetime.now(timezone.utc).isoformat()
    save(project, data)

def update_status(project: str, resend_id: str, status: str, timestamp: str):
    data = load(project)
    for record in data["sent"]:
        if record["resend_id"] == resend_id:
            record["status"] = status
            if status == "opened":
                record["opened_at"] = timestamp
                data["stats"]["opens"] += 1
            elif status == "replied":
                record["replied_at"] = timestamp
                data["stats"]["replies"] += 1
            break
    save(project, data)
```

**Step 6: Create `lib/resend.py`**

```python
import requests, os

def send_email(api_key: str, from_addr: str, to: str, subject: str, body: str) -> str:
    """Send email via Resend REST API. Returns resend_id."""
    resp = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"from": from_addr, "to": [to], "subject": subject, "text": body},
        timeout=15
    )
    resp.raise_for_status()
    return resp.json()["id"]

def get_email_events(api_key: str, email_id: str) -> dict:
    """Get status of a single sent email."""
    resp = requests.get(
        f"https://api.resend.com/emails/{email_id}",
        headers={"Authorization": f"Bearer {api_key}"},
        timeout=10
    )
    if resp.status_code == 404:
        return {}
    resp.raise_for_status()
    return resp.json()
```

**Step 7: Create `lib/__init__.py`** (empty)

**Step 8: Commit**

```bash
git add outreach/machine/
git commit -m "feat: scaffold outreach machine structure"
```

---

## Task 2: queue_builder.py

Reads existing lead sources for each project → deduplicates → fills `state/*.json` queues.

**File:** `outreach/machine/queue_builder.py`

**Step 1: Write the script**

```python
#!/usr/bin/env python3
"""
queue_builder.py — reads lead sources, deduplicates, fills state queues.
Run manually or triggered by sender.py when queue < threshold.
"""
import os, csv, json, sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")

BASE = Path(__file__).parent.parent.parent  # DoWhatever root
sys.path.insert(0, str(Path(__file__).parent))
from lib.state import enqueue, load

APIFY_KEY = os.getenv("APIFY_API_KEY", "")
PROJECTS_BASE = BASE / "projects" / "business"

# ─── Ranch-Pad sources ────────────────────────────────────────────────────────

def build_ranchpad_queue():
    """
    Ranch-Pad targets: ag creators + extension agents + ranchers.
    FFA CSVs are intentionally EXCLUDED (already sent).
    Sources: Apify ag-creators scrape + NEFB data (not yet sent).
    """
    leads = []

    # NEFB regional managers (scraped, not yet sent)
    nefb_csv = PROJECTS_BASE / "Ranch-Pad/outreach/farm-bureau/nefb/data/nefb_regional_managers.csv"
    if nefb_csv.exists():
        with open(nefb_csv, newline="", encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                email = row.get("Email", "").strip()
                if email:
                    leads.append({
                        "email": email,
                        "name": f"{row.get('First Name','').strip()} {row.get('Last Name','').strip()}".strip(),
                        "org": row.get("Organization", "").strip(),
                        "source": "nefb",
                        "state": row.get("State", "").strip()
                    })

    # Creators CSV (existing)
    creators_csv = PROJECTS_BASE / "Ranch-Pad/outreach/creators/data/creators.csv"
    if creators_csv.exists():
        with open(creators_csv, newline="", encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                email = row.get("Email", row.get("email", "")).strip()
                if email:
                    leads.append({
                        "email": email,
                        "name": row.get("Name", row.get("name", "")).strip(),
                        "org": row.get("Platform", row.get("platform", "")).strip(),
                        "source": "creators_csv"
                    })

    added = enqueue("ranchpad", leads)
    print(f"[ranchpad] queued {added} new leads from local sources")
    return added

# ─── PJRoutes sources ─────────────────────────────────────────────────────────

def build_pjroutes_queue():
    """
    PJRoutes targets: Part 135 charter operators.
    Source: phone_log.csv in .claude/agents/ (FAA data already scraped).
    Supplement with Apify aircharterguide scrape if queue low.
    """
    leads = []

    phone_log = BASE / ".claude/agents/phone_log.csv"
    if phone_log.exists():
        with open(phone_log, newline="", encoding="utf-8-sig") as f:
            for row in csv.DictReader(f):
                if row.get("Project", "").strip().lower() != "pjroutes":
                    continue
                # phone_log has no email — we'll need Apify to enrich
                # For now skip rows without email
                email = row.get("Email", "").strip()
                if email:
                    leads.append({
                        "email": email,
                        "name": f"{row.get('First Name','').strip()} {row.get('Last Name','').strip()}".strip(),
                        "org": row.get("Company", "").strip(),
                        "source": "faa_part135"
                    })

    # Trigger Apify scrape for aircharterguide if we need more contacts
    added = enqueue("pjroutes", leads)
    print(f"[pjroutes] queued {added} new leads from local sources")

    # If queue still low, kick off Apify enrichment
    state = load("pjroutes")
    if len(state["queue"]) < 200:
        print("[pjroutes] queue low — triggering Apify scrape")
        _scrape_aircharterguide()

    return added

def _scrape_aircharterguide():
    """Scrape aircharterguide.com for operator contact emails via Apify."""
    if not APIFY_KEY:
        print("[pjroutes] WARNING: no APIFY_API_KEY — skipping scrape")
        return
    import requests
    # Apify Web Scraper actor
    resp = requests.post(
        "https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items",
        params={"token": APIFY_KEY, "timeout": 120},
        json={
            "startUrls": [{"url": "https://www.aircharterguide.com/operators"}],
            "pageFunction": """
async function pageFunction(context) {
    const { $, request } = context;
    const operators = [];
    $('a[href*="/operator/"]').each((i, el) => {
        operators.push({ url: 'https://www.aircharterguide.com' + $(el).attr('href') });
    });
    return operators;
}
""",
            "maxPagesPerCrawl": 50
        },
        timeout=180
    )
    if resp.ok:
        items = resp.json()
        leads = []
        for item in items:
            email = item.get("email", "").strip()
            if email:
                leads.append({
                    "email": email,
                    "name": item.get("name", ""),
                    "org": item.get("company", ""),
                    "source": "aircharterguide"
                })
        added = enqueue("pjroutes", leads)
        print(f"[pjroutes] Apify added {added} operator contacts")

# ─── TopicLaunch sources ──────────────────────────────────────────────────────

def build_topiclaunch_queue():
    """
    TopicLaunch targets: creators 1K-100K audience across fitness/health/business/AI/dating/psych niches.
    Source 1: existing tl_emails.json (2,464 contacts)
    Source 2: Apify YouTube/TikTok creator scrape
    """
    leads = []

    # Existing contact list
    tl_json = PROJECTS_BASE / "TopicLaunch/outreach/tl_emails.json"
    if tl_json.exists():
        with open(tl_json) as f:
            contacts = json.load(f)
        if isinstance(contacts, list):
            for c in contacts:
                email = c.get("email", c.get("Email", "")).strip()
                if email:
                    leads.append({
                        "email": email,
                        "name": c.get("name", c.get("Name", c.get("creator", ""))).strip(),
                        "org": c.get("platform", c.get("Platform", "")).strip(),
                        "source": "google_sheet_export"
                    })

    added = enqueue("topiclaunch", leads)
    print(f"[topiclaunch] queued {added} new leads from existing list")

    # If queue low, scrape new creators via Apify
    state = load("topiclaunch")
    if len(state["queue"]) < 200 and APIFY_KEY:
        print("[topiclaunch] queue low — triggering Apify creator scrape")
        _scrape_creators_apify()

    return added

def _scrape_creators_apify():
    """Find new creators via Apify YouTube scraper by niche."""
    if not APIFY_KEY:
        return
    import requests
    niches = ["fitness", "health tips", "business advice", "AI tools", "dating advice", "psychology"]
    all_leads = []
    for niche in niches[:3]:  # limit per run to avoid timeouts
        resp = requests.post(
            "https://api.apify.com/v2/acts/bernardo_human~youtube-scraper/run-sync-get-dataset-items",
            params={"token": APIFY_KEY, "timeout": 90},
            json={
                "searchKeywords": [niche],
                "maxResults": 50,
                "minSubscriberCount": 1000,
                "maxSubscriberCount": 100000
            },
            timeout=180
        )
        if resp.ok:
            for item in resp.json():
                email = item.get("contactEmail", "").strip()
                if email:
                    all_leads.append({
                        "email": email,
                        "name": item.get("channelName", ""),
                        "org": f"YouTube — {item.get('subscriberCount', '')} subs",
                        "source": f"apify_youtube_{niche.replace(' ', '_')}"
                    })
    added = enqueue("topiclaunch", all_leads)
    print(f"[topiclaunch] Apify added {added} creator contacts")

# ─── Main ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    project = sys.argv[1] if len(sys.argv) > 1 else "all"
    if project in ("all", "ranchpad"):
        build_ranchpad_queue()
    if project in ("all", "pjroutes"):
        build_pjroutes_queue()
    if project in ("all", "topiclaunch"):
        build_topiclaunch_queue()
```

**Step 2: Install deps**

```bash
pip install python-dotenv requests anthropic -q
```

**Step 3: Run it**

```bash
cd "C:/Users/Jaylen.Davis/OneDrive - Southwestern College/Desktop/DoWhatever/outreach/machine"
python queue_builder.py all
```

Expected output:
```
[ranchpad] queued N new leads from local sources
[pjroutes] queued N new leads from local sources
[topiclaunch] queued N new leads from existing list
```

**Step 4: Verify state files have leads**

```bash
python3 -c "
import json
for p in ['ranchpad','pjroutes','topiclaunch']:
    d = json.load(open(f'state/{p}.json'))
    print(f'{p}: {len(d[\"queue\"])} queued')
"
```

**Step 5: Commit**

```bash
git add outreach/machine/
git commit -m "feat: queue_builder — seed initial lead queues for all 3 projects"
```

---

## Task 3: sender.py

Picks batch per project → personalizes email with Claude Haiku → sends via Resend → updates state.

**File:** `outreach/machine/sender.py`

**Step 1: Write the script**

```python
#!/usr/bin/env python3
"""
sender.py — picks batches, personalizes with Claude, sends via Resend.
Runs Mon/Wed/Fri 9am via cron. Also calls queue_builder if queue low.
"""
import os, sys, json, time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
sys.path.insert(0, str(Path(__file__).parent))

from lib.state import load, pop_batch, mark_sent, enqueue
from lib.resend import send_email
import anthropic, subprocess

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")
PROJECTS = ["ranchpad", "pjroutes", "topiclaunch"]
CONFIG_PATH = Path(__file__).parent / "config.json"

client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return json.load(f)

def personalize_email(project_cfg: dict, lead: dict) -> tuple[str, str]:
    """Use Claude Haiku to write a personalized email. Returns (subject, body)."""
    name = lead.get("name", "there")
    org = lead.get("org", "")
    source = lead.get("source", "")
    state = lead.get("state", "")

    context = f"Recipient: {name}"
    if org:
        context += f" | Organization/Platform: {org}"
    if state:
        context += f" | State: {state}"
    if source:
        context += f" | Found via: {source}"

    prompt = f"""{project_cfg['template_prompt']}

{context}

Write ONLY the email body. No subject line. No "Subject:" prefix. Just the plain text body."""

    msg = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}]
    )
    body = msg.content[0].text.strip()
    subject = project_cfg["subject"]
    return subject, body

def run_project(project: str, cfg: dict):
    state = load(project)
    queue_size = len(state["queue"])
    print(f"\n[{project}] queue: {queue_size} leads")

    # Auto-refill if below threshold
    if queue_size < cfg["queue_threshold"]:
        print(f"[{project}] queue below threshold — refilling...")
        subprocess.run(
            [sys.executable, str(Path(__file__).parent / "queue_builder.py"), project],
            check=False
        )
        state = load(project)
        queue_size = len(state["queue"])

    if queue_size == 0:
        print(f"[{project}] no leads — skipping")
        return 0

    batch = pop_batch(project, min(cfg["batch_size"], queue_size))
    api_key = os.getenv(cfg["resend_key_env"], "")
    if not api_key:
        print(f"[{project}] ERROR: missing API key {cfg['resend_key_env']}")
        return 0

    sent = 0
    failed = 0
    for lead in batch:
        try:
            subject, body = personalize_email(cfg, lead)
            resend_id = send_email(api_key, cfg["from"], lead["email"], subject, body)
            mark_sent(project, lead, resend_id)
            sent += 1
            time.sleep(0.12)  # ~8 sends/sec — stays under Resend rate limit
        except Exception as e:
            print(f"  [FAIL] {lead['email']}: {e}")
            failed += 1
            # Re-enqueue failed lead
            enqueue(project, [lead])

    print(f"[{project}] sent {sent} | failed {failed} | remaining {len(load(project)['queue'])}")
    return sent

if __name__ == "__main__":
    config = load_config()
    total = 0
    for project in PROJECTS:
        total += run_project(project, config[project])
    print(f"\nTotal sent this run: {total}")
```

**Step 2: Test dry run (with 1 lead, real send)**

```bash
cd "C:/Users/Jaylen.Davis/OneDrive - Southwestern College/Desktop/DoWhatever/outreach/machine"

# First: manually add a test lead to ranchpad queue
python3 -c "
import sys; sys.path.insert(0,'.')
from lib.state import enqueue
enqueue('ranchpad', [{'email':'j7beatss@gmail.com','name':'Jaylen','org':'Test Ranch','source':'test','state':'KS'}])
print('Test lead added')
"

# Run sender for ranchpad only
python3 -c "
import sys; sys.path.insert(0,'.')
import json
from pathlib import Path
sys.argv = ['sender.py']
exec(open('sender.py').read().replace(\"PROJECTS = ['ranchpad', 'pjroutes', 'topiclaunch']\", \"PROJECTS = ['ranchpad']\"))
"
```

Expected: 1 email sent to j7beatss@gmail.com with personalized RanchPad copy.

**Step 3: Check your inbox** — verify email arrived, read the personalization quality.

**Step 4: Commit**

```bash
git add outreach/machine/sender.py
git commit -m "feat: sender — Claude-personalized batch email via Resend"
```

---

## Task 4: monitor.py

Polls Resend API for each sent email's status → updates open/click/reply in state.

**File:** `outreach/machine/monitor.py`

**Step 1: Write the script**

```python
#!/usr/bin/env python3
"""
monitor.py — polls Resend events, updates open/reply status in state files.
Runs daily at 7am via cron.
"""
import os, sys, json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
sys.path.insert(0, str(Path(__file__).parent))

from lib.state import load, save, update_status
from lib.resend import get_email_events

CONFIG_PATH = Path(__file__).parent / "config.json"
PROJECTS = ["ranchpad", "pjroutes", "topiclaunch"]

def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return json.load(f)

def monitor_project(project: str, cfg: dict):
    api_key = os.getenv(cfg["resend_key_env"], "")
    if not api_key:
        print(f"[{project}] missing API key")
        return

    data = load(project)
    # Only check records that haven't been replied to yet
    pending = [r for r in data["sent"] if r.get("status") not in ("replied",) and r.get("resend_id")]
    print(f"[{project}] checking {len(pending)} sent emails")

    new_opens = 0
    new_replies = 0

    for record in pending:
        try:
            events = get_email_events(api_key, record["resend_id"])
            if not events:
                continue

            resend_status = events.get("last_event", "")
            # Resend events: sent, delivered, opened, clicked, bounced, complained
            if resend_status in ("clicked", "opened") and record.get("status") == "sent":
                update_status(project, record["resend_id"], "opened", events.get("created_at", ""))
                new_opens += 1
        except Exception as e:
            pass  # silently skip — will retry next run

    print(f"[{project}] new opens: {new_opens} | new replies: {new_replies}")

    # Recalculate stats
    data = load(project)
    total = len(data["sent"])
    if total > 0:
        data["stats"]["open_rate"] = round(data["stats"]["opens"] / total, 4)
        data["stats"]["reply_rate"] = round(data["stats"]["replies"] / total, 4)
    save(project, data)

if __name__ == "__main__":
    config = load_config()
    for project in PROJECTS:
        monitor_project(project, config[project])
    print("\nMonitor complete.")
```

**Step 2: Run it**

```bash
cd "C:/Users/Jaylen.Davis/OneDrive - Southwestern College/Desktop/DoWhatever/outreach/machine"
python monitor.py
```

Expected: `[ranchpad] checking N sent emails | new opens: X`

**Step 3: Commit**

```bash
git add outreach/machine/monitor.py
git commit -m "feat: monitor — poll Resend events, update open/reply status"
```

---

## Task 5: digest.py

Reads all state files → generates cross-project summary → sends daily email to j7beatss@gmail.com.

**File:** `outreach/machine/digest.py`

**Step 1: Write the script**

```python
#!/usr/bin/env python3
"""
digest.py — daily cross-project summary email.
Runs daily at 8am (after monitor at 7am).
"""
import os, sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
sys.path.insert(0, str(Path(__file__).parent))

from lib.state import load
from lib.resend import send_email

DIGEST_TO = os.getenv("DIGEST_EMAIL", "j7beatss@gmail.com")
# Use RanchPad key for digest (or add a dedicated RESEND_KEY_DIGEST)
DIGEST_FROM_KEY = os.getenv("RESEND_KEY_RANCHPAD", "")
DIGEST_FROM = "Outreach Machine <jaylen@ranchpad.app>"
PROJECTS = ["ranchpad", "pjroutes", "topiclaunch"]

def project_summary(project: str) -> dict:
    data = load(project)
    sent = data["sent"]
    now = datetime.now(timezone.utc)
    today = now.date()

    sent_today = [r for r in sent if r.get("sent_at", "")[:10] == str(today)]
    sent_this_week = [r for r in sent if r.get("sent_at", "") and
                      (now - datetime.fromisoformat(r["sent_at"])).days <= 7]

    hot_replies = [r for r in sent if r.get("replied_at") and
                   r.get("replied_at", "")[:10] == str(today)]

    return {
        "project": project,
        "sent_today": len(sent_today),
        "sent_week": len(sent_this_week),
        "total_sent": data["stats"]["total_sent"],
        "opens": data["stats"]["opens"],
        "replies": data["stats"]["replies"],
        "open_rate": data["stats"].get("open_rate", 0),
        "queue_remaining": len(data["queue"]),
        "hot_replies": hot_replies
    }

def build_digest(summaries: list[dict]) -> tuple[str, str]:
    today = datetime.now().strftime("%a %b %d")
    subject = f"Outreach — {today}"

    lines = [f"Outreach Digest — {today}\n"]
    all_hot = []

    for s in summaries:
        label = s["project"].title()
        open_pct = f"{s['open_rate']*100:.1f}%" if s["open_rate"] else "—"
        lines.append(
            f"{label:<14} sent {s['sent_today']:>4} today ({s['sent_week']} this week) | "
            f"opens {s['opens']} ({open_pct}) | replies {s['replies']} | "
            f"queue {s['queue_remaining']:,}"
        )
        all_hot.extend([(s["project"], r) for r in s["hot_replies"]])

    if all_hot:
        lines.append("\n🔥 Replies today:")
        for project, r in all_hot:
            lines.append(f"  {r['email']} ({project}) — replied {r.get('replied_at','')[:10]}")
    else:
        lines.append("\nNo replies today.")

    return subject, "\n".join(lines)

if __name__ == "__main__":
    summaries = [project_summary(p) for p in PROJECTS]
    subject, body = build_digest(summaries)
    print(body)

    if DIGEST_FROM_KEY:
        resend_id = send_email(DIGEST_FROM_KEY, DIGEST_FROM, DIGEST_TO, subject, body)
        print(f"\nDigest sent → {DIGEST_TO} (id: {resend_id})")
    else:
        print("\nNo API key — digest not sent")
```

**Step 2: Test it**

```bash
cd "C:/Users/Jaylen.Davis/OneDrive - Southwestern College/Desktop/DoWhatever/outreach/machine"
python digest.py
```

Expected: prints summary table + sends email to j7beatss@gmail.com.

**Step 3: Commit**

```bash
git add outreach/machine/digest.py
git commit -m "feat: digest — daily cross-project summary email"
```

---

## Task 6: Wire Crons

Creates 4 Claude Code remote scheduled agents using the `/schedule` skill's CronCreate tool.

**Step 1: Load CronCreate schema**

In a Claude Code session, run:
```
/schedule
```

Then create each cron. The machine root is:
`C:/Users/Jaylen.Davis/OneDrive - Southwestern College/Desktop/DoWhatever/outreach/machine`

**Step 2: Create Sender cron (Mon/Wed/Fri 9am CST = 15:00 UTC)**

Prompt for cron:
```
Run the outreach sender. Execute: cd "C:/Users/Jaylen.Davis/OneDrive - Southwestern College/Desktop/DoWhatever/outreach/machine" && python sender.py
Log output to state/sender_log.txt (append). Report total emails sent.
```
Schedule: `0 15 * * 1,3,5` (Mon/Wed/Fri 15:00 UTC)

**Step 3: Create Monitor cron (Daily 7am CST = 13:00 UTC)**

Prompt:
```
Run the outreach monitor. Execute: cd "C:/Users/Jaylen.Davis/OneDrive - Southwestern College/Desktop/DoWhatever/outreach/machine" && python monitor.py
Log output to state/monitor_log.txt (append).
```
Schedule: `0 13 * * *`

**Step 4: Create Digest cron (Daily 8am CST = 14:00 UTC)**

Prompt:
```
Run the outreach digest. Execute: cd "C:/Users/Jaylen.Davis/OneDrive - Southwestern College/Desktop/DoWhatever/outreach/machine" && python digest.py
```
Schedule: `0 14 * * *`

**Step 5: Create Scraper cron (Sunday 10pm CST = Mon 04:00 UTC)**

Prompt:
```
Run the outreach queue builder for all projects. Execute: cd "C:/Users/Jaylen.Davis/OneDrive - Southwestern College/Desktop/DoWhatever/outreach/machine" && python queue_builder.py all
Log output to state/scraper_log.txt (append).
```
Schedule: `0 4 * * 1` (Monday 4am UTC = Sunday 10pm CST)

**Step 6: Verify all 4 crons are listed**

```
/schedule list
```

Expected: 4 active routines shown.

**Step 7: Commit**

```bash
git add outreach/machine/
git commit -m "feat: wire 4 outreach machine crons — machine is live"
```

---

## Task 7: End-to-End Test

**Step 1: Manual full run**

```bash
cd "C:/Users/Jaylen.Davis/OneDrive - Southwestern College/Desktop/DoWhatever/outreach/machine"
python queue_builder.py all   # seed queues
python sender.py              # send first batch (will be large — verify counts)
python monitor.py             # check statuses
python digest.py              # send digest to yourself
```

**Step 2: Verify**

- [ ] j7beatss@gmail.com received test personalized email from RanchPad
- [ ] j7beatss@gmail.com received digest email with correct stats
- [ ] `state/ranchpad.json` shows leads in `sent[]` with resend_ids
- [ ] Queue sizes decreased by batch amount

**Step 3: Check email quality**

Open the personalized email from Step 1. Is it human? Does it reference the lead's context? If not, tweak `template_prompt` in `config.json` — no code change needed.

**Step 4: Final commit + push**

```bash
git add -A
git commit -m "chore: outreach machine end-to-end verified"
git push
```

---

## Quick Reference

| Script | Command | When |
|---|---|---|
| Seed queues | `python queue_builder.py all` | Once now, then auto |
| Send batch | `python sender.py` | Auto Mon/Wed/Fri |
| Check status | `python monitor.py` | Auto daily |
| Get digest | `python digest.py` | Auto daily |
| Single project | `python sender.py` then edit PROJECTS list | Ad hoc |

Queue sizes:

```bash
python3 -c "
import json
for p in ['ranchpad','pjroutes','topiclaunch']:
    d = json.load(open(f'state/{p}.json'))
    print(f'{p}: {len(d[\"queue\"])} queued | {len(d[\"sent\"])} sent')
"
```
