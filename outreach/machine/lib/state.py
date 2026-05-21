import json, os, uuid
from pathlib import Path
from datetime import datetime, timezone

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
    tmp.replace(path)

def get_seen_emails(project: str) -> set:
    data = load(project)
    sent = {r["email"].lower() for r in data["sent"]}
    queued = {r["email"].lower() for r in data["queue"]}
    return sent | queued

def enqueue(project: str, leads: list) -> int:
    data = load(project)
    existing = get_seen_emails(project)
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

def pop_batch(project: str, n: int) -> list:
    data = load(project)
    batch = data["queue"][:n]
    data["queue"] = data["queue"][n:]
    save(project, data)
    return batch

def mark_sent(project: str, lead: dict, resend_id: str):
    data = load(project)
    data["sent"].append({
        "id": lead.get("id", str(uuid.uuid4())),
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
        if record.get("resend_id") == resend_id:
            record["status"] = status
            if status == "opened" and not record.get("opened_at"):
                record["opened_at"] = timestamp
                data["stats"]["opens"] = data["stats"].get("opens", 0) + 1
            elif status == "replied" and not record.get("replied_at"):
                record["replied_at"] = timestamp
                data["stats"]["replies"] = data["stats"].get("replies", 0) + 1
            break
    total = data["stats"].get("total_sent", 1)
    data["stats"]["open_rate"] = round(data["stats"].get("opens", 0) / max(total, 1), 4)
    data["stats"]["reply_rate"] = round(data["stats"].get("replies", 0) / max(total, 1), 4)
    save(project, data)
