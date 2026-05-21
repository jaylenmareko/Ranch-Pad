import json, uuid
from pathlib import Path
from datetime import datetime, timezone

BASE = Path(__file__).parent.parent
STATE_DIR = BASE / "state"

def load(project: str) -> dict:
    path = STATE_DIR / f"{project}.json"
    try:
        with open(path) as f:
            return json.load(f)
    except FileNotFoundError:
        raise FileNotFoundError(f"State file not found for project: {project} (expected: {path})")

def save(project: str, data: dict):
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    path = STATE_DIR / f"{project}.json"
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2, default=str)
    tmp.replace(path)

def get_seen_emails(project: str) -> set:
    data = load(project)
    sent = {r.get("email", "").lower() for r in data["sent"]}
    queued = {r.get("email", "").lower() for r in data["queue"]}
    in_flight = {r.get("email", "").lower() for r in data.get("in_flight", [])}
    return sent | queued | in_flight

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
    data.setdefault("in_flight", []).extend(batch)
    save(project, data)
    return batch

def mark_sent(project: str, lead: dict, resend_id: str):
    data = load(project)
    email = lead.get("email", "")
    if not email:
        return
    data["in_flight"] = [r for r in data.get("in_flight", []) if r.get("id") != lead.get("id")]
    data["sent"].append({
        "id": lead.get("id", str(uuid.uuid4())),
        "email": email,
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

def release_from_inflight(project: str, lead_ids: list):
    """Remove leads from in_flight without marking as sent (used on send failure)."""
    if not lead_ids:
        return
    id_set = set(lead_ids)
    data = load(project)
    data["in_flight"] = [r for r in data.get("in_flight", []) if r.get("id") not in id_set]
    save(project, data)

def update_status(project: str, resend_id: str, status: str, timestamp: str):
    data = load(project)
    matched = False
    for record in data["sent"]:
        if record.get("resend_id") == resend_id:
            record["status"] = status
            if status == "opened" and not record.get("opened_at"):
                record["opened_at"] = timestamp
                data["stats"]["opens"] = data["stats"].get("opens", 0) + 1
            elif status == "replied" and not record.get("replied_at"):
                record["replied_at"] = timestamp
                data["stats"]["replies"] = data["stats"].get("replies", 0) + 1
            matched = True
            break
    if not matched:
        print(f"[update_status] WARNING: resend_id {resend_id} not found in {project}")
        return
    total = max(data["stats"].get("total_sent", 1), 1)
    data["stats"]["open_rate"] = round(data["stats"].get("opens", 0) / total, 4)
    data["stats"]["reply_rate"] = round(data["stats"].get("replies", 0) / total, 4)
    save(project, data)
