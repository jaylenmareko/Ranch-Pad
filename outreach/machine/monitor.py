#!/usr/bin/env python3
"""
monitor.py — polls Resend API for email status updates, writes to state files.
Runs daily at 7am CST via cron (before digest at 8am).
Usage: python monitor.py [all|ranchpad|pjroutes|topiclaunch]
"""
import os, sys, time
from pathlib import Path
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
sys.path.insert(0, str(Path(__file__).parent))

from lib.state import load, save, update_status
from lib.resend import get_email_status

import json
CONFIG_PATH = Path(__file__).parent / "config.json"
PROJECTS = ["ranchpad", "pjroutes", "topiclaunch"]
LOG_PATH = Path.home() / "AppData" / "Local" / "outreach-machine" / "state" / "monitor_log.txt"

def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return json.load(f)

def monitor_project(project: str, api_key: str) -> dict:
    data = load(project)
    # Only check records not yet replied (opened/sent are still worth polling)
    pending = [r for r in data["sent"]
               if r.get("status") not in ("replied",) and r.get("resend_id")]

    print(f"[{project}] checking {len(pending)} sent emails")
    new_opens = 0
    errors = 0

    for record in pending:
        try:
            info = get_email_status(api_key, record["resend_id"])
            if not info:
                continue  # 404 — email not found, skip

            # Resend returns last_event: "delivered" | "opened" | "clicked" | "bounced" | "complained"
            last_event = info.get("last_event", "")
            created_at = info.get("created_at", datetime.now(timezone.utc).isoformat())

            if last_event in ("opened", "clicked") and record.get("status") == "sent":
                update_status(project, record["resend_id"], "opened", created_at)
                new_opens += 1

            time.sleep(0.05)  # avoid hammering Resend API
        except Exception as e:
            errors += 1
            if errors <= 3:  # don't flood logs
                print(f"  [warn] {record.get('resend_id','?')}: {e}")

    print(f"[{project}] new_opens={new_opens} errors={errors}")
    return {"project": project, "checked": len(pending), "new_opens": new_opens, "errors": errors}

def log_run(results: list):
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).isoformat()
    with open(LOG_PATH, "a") as f:
        for r in results:
            f.write(f"[{ts}] {r['project']}: checked={r['checked']} new_opens={r['new_opens']} errors={r['errors']}\n")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    config = load_config()

    projects = PROJECTS if target == "all" else ([target] if target in config else None)
    if projects is None:
        print(f"Unknown project: {target}")
        sys.exit(1)

    results = []
    for project in projects:
        api_key = os.getenv(config[project]["resend_key_env"], "")
        if not api_key:
            print(f"[{project}] missing API key — skipping")
            continue
        result = monitor_project(project, api_key)
        results.append(result)

    log_run(results)
    print("\nMonitor complete.")
