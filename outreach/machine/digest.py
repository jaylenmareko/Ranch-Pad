#!/usr/bin/env python3
"""
digest.py — daily cross-project outreach summary email.
Runs daily at 8am CST (after monitor at 7am).
Usage: python digest.py
"""
import os, sys, json
from pathlib import Path
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
sys.path.insert(0, str(Path(__file__).parent))

from lib.state import load
from lib.resend import send_email

DIGEST_TO = os.getenv("DIGEST_EMAIL", "j7beatss@gmail.com")
DIGEST_FROM_KEY = os.getenv("RESEND_KEY_RANCHPAD", "")
DIGEST_FROM = "Outreach Machine <jaylen@ranchpad.app>"
PROJECTS = ["ranchpad", "pjroutes", "topiclaunch"]

def project_summary(project: str) -> dict:
    data = load(project)
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    week_ago = now - timedelta(days=7)

    sent_today = [r for r in data["sent"] if r.get("sent_at", "")[:10] == today_str]
    sent_week = [r for r in data["sent"]
                 if r.get("sent_at") and
                 datetime.fromisoformat(r["sent_at"]) >= week_ago]

    hot_replies = [r for r in data["sent"]
                   if r.get("replied_at") and r["replied_at"][:10] == today_str]
    recent_opens = [r for r in data["sent"]
                    if r.get("opened_at") and r["opened_at"][:10] == today_str]

    return {
        "project": project,
        "sent_today": len(sent_today),
        "sent_week": len(sent_week),
        "total_sent": data["stats"]["total_sent"],
        "opens": data["stats"].get("opens", 0),
        "replies": data["stats"].get("replies", 0),
        "open_rate": data["stats"].get("open_rate", 0.0),
        "queue_remaining": len(data["queue"]),
        "hot_replies": hot_replies,
        "recent_opens": recent_opens,
    }

def build_digest_email(summaries: list) -> tuple:
    today = datetime.now().strftime("%a %b %-d") if sys.platform != "win32" else datetime.now().strftime("%a %b %#d")
    subject = f"Outreach — {today}"

    lines = [f"Outreach Digest — {today}", ""]

    for s in summaries:
        label = s["project"].title().replace("Pjroutes", "PJRoutes").replace("Topiclaunch", "TopicLaunch")
        open_pct = f"{s['open_rate']*100:.1f}%" if s["open_rate"] else "—"
        lines.append(
            f"{label:<13} | today: {s['sent_today']:>4} | week: {s['sent_week']:>5} | "
            f"opens: {s['opens']} ({open_pct}) | replies: {s['replies']} | "
            f"queue: {s['queue_remaining']:,}"
        )

    # Hot replies section
    all_replies = [(s["project"], r) for s in summaries for r in s["hot_replies"]]
    if all_replies:
        lines.append("")
        lines.append("🔥 Replies today:")
        for project, r in all_replies:
            name = r.get("name", "")
            lines.append(f"  {r['email']}{f' ({name})' if name else ''} — {project}")
    else:
        lines.append("")
        lines.append("No replies today.")

    # Recent opens
    all_opens = [(s["project"], r) for s in summaries for r in s["recent_opens"]]
    if all_opens:
        lines.append("")
        lines.append(f"👀 Opens today ({len(all_opens)}):")
        for project, r in all_opens[:5]:  # cap at 5 to keep email short
            lines.append(f"  {r['email']} — {project}")
        if len(all_opens) > 5:
            lines.append(f"  ... and {len(all_opens)-5} more")

    # Totals
    total_sent = sum(s["total_sent"] for s in summaries)
    total_queue = sum(s["queue_remaining"] for s in summaries)
    lines.append("")
    lines.append(f"Total sent all-time: {total_sent:,} | Total queued: {total_queue:,}")

    return subject, "\n".join(lines)

if __name__ == "__main__":
    summaries = [project_summary(p) for p in PROJECTS]
    subject, body = build_digest_email(summaries)

    print(body)
    print()

    if DIGEST_FROM_KEY:
        try:
            resend_id = send_email(DIGEST_FROM_KEY, DIGEST_FROM, DIGEST_TO, subject, body)
            print(f"Digest sent to {DIGEST_TO} (id: {resend_id})")
        except Exception as e:
            print(f"Send failed: {e}")
            print("(Domain may not be verified — digest printed above)")
    else:
        print("No API key — digest printed only, not sent")
