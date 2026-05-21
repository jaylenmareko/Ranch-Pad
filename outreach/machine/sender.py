#!/usr/bin/env python3
"""
sender.py — picks batches per project, personalizes with Claude Haiku, sends via Resend.
Runs Mon/Wed/Fri 9am CST via cron. Self-refills queue if below threshold.
Usage: python sender.py [all|ranchpad|pjroutes|topiclaunch]
"""
import os, sys, json, time
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
sys.path.insert(0, str(Path(__file__).parent))

from lib.state import load, pop_batch, mark_sent, enqueue
from lib.resend import send_email
import anthropic
import subprocess

ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CONFIG_PATH = Path(__file__).parent / "config.json"
PROJECTS = ["ranchpad", "pjroutes", "topiclaunch"]
LOG_PATH = Path(__file__).parent / "state" / "sender_log.txt"

def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return json.load(f)

def personalize(project_cfg: dict, lead: dict) -> tuple:
    """Generate personalized subject + body using Claude Haiku. Falls back to template on error."""
    if not ANTHROPIC_KEY:
        # Fallback: use a simple generic body
        name = lead.get("name", "").split()[0] if lead.get("name") else "there"
        return project_cfg["subject"], f"Hey {name},\n\n{project_cfg['template_prompt'][:200]}\n\nJaylen"

    name = lead.get("name", "").strip()
    org = lead.get("org", "").strip()
    state = lead.get("state", "").strip()
    source = lead.get("source", "").strip()

    context_parts = [f"Recipient name: {name}" if name else "Recipient: unknown name"]
    if org:
        context_parts.append(f"Organization/Platform: {org}")
    if state:
        context_parts.append(f"State: {state}")
    if source:
        context_parts.append(f"Found via: {source}")

    prompt = f"""{project_cfg['template_prompt']}

{chr(10).join(context_parts)}

Write ONLY the email body. No subject line. No greeting header. Start directly with the first sentence. Plain text only."""

    try:
        client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
        msg = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=250,
            messages=[{"role": "user", "content": prompt}]
        )
        body = msg.content[0].text.strip()
        return project_cfg["subject"], body
    except Exception as e:
        print(f"  [warn] Claude personalization failed: {e} — using fallback")
        first = name.split()[0] if name else "there"
        return project_cfg["subject"], f"Hey {first},\n\nThought this might be relevant to you.\n\nJaylen"

def refill_if_needed(project: str, threshold: int):
    state = load(project)
    if len(state["queue"]) < threshold:
        print(f"  [{project}] queue={len(state['queue'])} < {threshold} — refilling...")
        subprocess.run(
            [sys.executable, str(Path(__file__).parent / "queue_builder.py"), project],
            check=False, capture_output=False
        )

def run_project(project: str, cfg: dict) -> int:
    state = load(project)
    print(f"\n[{project}] queue={len(state['queue'])} | sent_total={state['stats']['total_sent']}")

    refill_if_needed(project, cfg["queue_threshold"])
    state = load(project)  # reload after refill

    if not state["queue"]:
        print(f"  [{project}] empty queue — skipping")
        return 0

    api_key = os.getenv(cfg["resend_key_env"], "")
    if not api_key:
        print(f"  [{project}] ERROR: env var {cfg['resend_key_env']} not set")
        return 0

    batch_size = min(cfg["batch_size"], len(state["queue"]))
    batch = pop_batch(project, batch_size)
    print(f"  [{project}] sending {len(batch)} emails...")

    sent = failed = 0
    failed_leads = []

    for lead in batch:
        try:
            subject, body = personalize(cfg, lead)
            resend_id = send_email(api_key, cfg["from"], lead["email"], subject, body)
            mark_sent(project, lead, resend_id)
            sent += 1
            time.sleep(0.15)  # ~6.5 sends/sec — within Resend limits
        except Exception as e:
            print(f"  [FAIL] {lead.get('email','?')}: {e}")
            failed_leads.append(lead)
            failed += 1

    # Re-enqueue failed leads
    if failed_leads:
        re_added = enqueue(project, failed_leads)
        print(f"  [{project}] re-queued {re_added} failed leads")

    print(f"  [{project}] sent={sent} failed={failed} queue_remaining={len(load(project)['queue'])}")
    return sent

def log_run(summary: str):
    from datetime import datetime, timezone
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_PATH, "a") as f:
        f.write(f"[{datetime.now(timezone.utc).isoformat()}] {summary}\n")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    config = load_config()

    projects = PROJECTS if target == "all" else ([target] if target in config else None)
    if projects is None:
        print(f"Unknown project: {target}")
        sys.exit(1)

    totals = {}
    for project in projects:
        totals[project] = run_project(project, config[project])

    summary = " | ".join(f"{p}={n}" for p, n in totals.items())
    total_sent = sum(totals.values())
    print(f"\nRun complete: {summary} | total={total_sent}")
    log_run(f"sent: {summary} | total={total_sent}")
