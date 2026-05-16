"""
Outreach module. Reads contacts, checks daily limit, sends emails via Resend REST API.
Tracks sent emails in send_log.json. Falls back to phone log if no email on contact.
"""

import csv
import json
import os
import requests
from datetime import date
from pathlib import Path

ROOT        = Path(__file__).parent.parent.parent  # DoWhatever/
SEND_LOG    = Path(__file__).parent / "send_log.json"
PHONE_LOG   = Path(__file__).parent / "phone_log.csv"
DAILY_LIMIT = 200

# ── Fill this in once you upload a YouTube demo ───────────────────────────────
RANCHPAD_YOUTUBE = "https://youtu.be/NNxL2XvY6RU?si=6d2cUZcio12ZwuBM"

CONFIGS = {
    "Ranch-Pad": {
        "env_file":    ROOT / "projects/business/Ranch-Pad/outreach/.env",
        "resend_key":  None,  # loaded from env_file
        "from_email":  "Jaylen Davis <jaylen@ranchpad.app>",
        "contacts_fn": "_get_ranchpad_contacts",
        "subject":     "RanchPad — worth 5 minutes?",
        "body": (
            "Hey {first_name},\n\n"
            "RanchPad keeps your livestock records, medications, and animal history in one place — "
            "built for ranchers. {youtube}\n\n"
            "Open for a quick call this week?\n\n"
            "— Jaylen\n"
            "ranchpad.app"
        ),
    },
    "pjroutes": {
        "env_file":   None,
        "resend_key": "re_4LmPWRn9_NLhTMktvHQApomEukwcxefHk",
        "from_email": "Jaylen Davis <jaylen@pjroutes.com>",
        "contacts_fn": "_get_pjroutes_contacts",
        # Targeting smaller regional operators only — not large carriers or Part 121.
        # When Apify scrapes new contacts: filter for small Part 135 operators,
        # avoid operators with fleets > 20 aircraft or revenue > $50M.
        "subject":    "Empty legs sitting on your schedule?",
        "body": (
            "Hey {first_name},\n\n"
            "I run PJRoutes.com — a marketplace for empty leg flights. "
            "Your empty legs get listed, passengers book and pay, you confirm and get paid.\n\n"
            "No catch. We add our fee on top of what you set.\n\n"
            "Open to a quick 5-minute call this week?\n\n"
            "— Jaylen Davis\n"
            "PJRoutes | 314-503-9422 | pjroutes.com"
        ),
    },
}


# ── Send log helpers ──────────────────────────────────────────────────────────

def _load_log() -> dict:
    if SEND_LOG.exists():
        try:
            return json.loads(SEND_LOG.read_text())
        except Exception:
            pass
    return {}


def _save_log(log: dict):
    SEND_LOG.write_text(json.dumps(log, indent=2))


def _sent_today(project: str) -> set:
    log = _load_log()
    today = str(date.today())
    return set(log.get(today, {}).get(project, []))


def _record_send(project: str, email: str):
    log = _load_log()
    today = str(date.today())
    log.setdefault(today, {}).setdefault(project, [])
    if email not in log[today][project]:
        log[today][project].append(email)
    _save_log(log)


def _log_phone(first_name: str, last_name: str, phone: str, company: str, project: str):
    header = not PHONE_LOG.exists()
    with open(PHONE_LOG, "a", newline="") as f:
        writer = csv.writer(f)
        if header:
            writer.writerow(["Date", "Project", "First Name", "Last Name", "Company", "Phone"])
        writer.writerow([date.today(), project, first_name, last_name, company, phone])


# ── Contact loaders ───────────────────────────────────────────────────────────

def _get_ranchpad_contacts() -> list[dict]:
    data_dir    = ROOT / "projects/business/Ranch-Pad/outreach/ffa/data"
    already_sent_file = data_dir / "already_sent.txt"

    already_sent = set()
    if already_sent_file.exists():
        already_sent = set(already_sent_file.read_text().splitlines())

    contacts = []
    for csv_file in sorted(data_dir.glob("*_ffa_advisors.csv")):
        try:
            with open(csv_file, newline="", encoding="utf-8-sig") as f:
                for row in csv.DictReader(f):
                    email = row.get("Email", "").strip().lower()
                    phone = row.get("Phone", "").strip()
                    first = row.get("First Name", "").strip()
                    last  = row.get("Last Name", "").strip()
                    school = row.get("School", "").strip()
                    if email and email not in already_sent:
                        contacts.append({
                            "first_name": first or "there",
                            "last_name":  last,
                            "email":      email,
                            "phone":      phone,
                            "company":    school,
                        })
                    elif not email and phone:
                        contacts.append({
                            "first_name": first or "there",
                            "last_name":  last,
                            "email":      "",
                            "phone":      phone,
                            "company":    school,
                        })
        except Exception:
            continue

    return contacts


def _get_pjroutes_contacts() -> list[dict]:
    csv_path = ROOT / "projects/business/pjroutes/outreach/tier1-operators-enriched.csv"
    contacts = []
    if not csv_path.exists():
        return contacts
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))

    for row in rows:
        if row.get("Contacted", "No").strip().lower() == "yes":
            continue
        email = row.get("Email", "").strip()
        phone = row.get("Phone", "").strip()
        name  = row.get("Operator Name", "").strip()
        first = name.split()[0] if name else "there"
        contacts.append({
            "first_name": first,
            "last_name":  "",
            "email":      email,
            "phone":      phone,
            "company":    name,
        })

    return contacts


def _mark_pjroutes_contacted(email: str):
    csv_path = ROOT / "projects/business/pjroutes/outreach/tier1-operators-enriched.csv"
    if not csv_path.exists():
        return
    with open(csv_path, newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
        fieldnames = rows[0].keys() if rows else []

    for row in rows:
        if row.get("Email", "").strip().lower() == email.lower():
            row["Contacted"] = "Yes"

    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def _mark_ranchpad_sent(email: str):
    already_sent_file = ROOT / "projects/business/Ranch-Pad/outreach/ffa/data/already_sent.txt"
    with open(already_sent_file, "a") as f:
        f.write(email + "\n")


# ── Resend API call ───────────────────────────────────────────────────────────

def _send_email(api_key: str, from_email: str, to: str, subject: str, body: str) -> bool:
    resp = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"from": from_email, "to": [to], "subject": subject, "text": body},
        timeout=10,
    )
    return resp.status_code in (200, 201)


# ── Main entrypoint ───────────────────────────────────────────────────────────

def run_outreach(project: str) -> str:
    cfg = CONFIGS.get(project)
    if not cfg:
        return f"No outreach config for {project}."

    # Load API key
    api_key = cfg["resend_key"]
    if cfg["env_file"] and Path(cfg["env_file"]).exists():
        for line in Path(cfg["env_file"]).read_text().splitlines():
            if line.startswith("RESEND_API_KEY="):
                api_key = line.split("=", 1)[1].strip()
                break

    if not api_key:
        return "Outreach skipped — no Resend API key found."

    # Load contacts
    loader = _get_ranchpad_contacts if project == "Ranch-Pad" else _get_pjroutes_contacts
    all_contacts = loader()

    sent_today   = _sent_today(project)
    remaining    = DAILY_LIMIT - len(sent_today)

    if remaining <= 0:
        return f"Outreach: daily limit of {DAILY_LIMIT} already reached for {project}."

    # Filter out already sent today and contacts with no email + no phone
    to_contact = [
        c for c in all_contacts
        if c["email"] not in sent_today and (c["email"] or c["phone"])
    ]

    sent_count   = 0
    phoned_count = 0
    skipped      = 0

    for contact in to_contact:
        if sent_count >= remaining:
            break

        first = contact["first_name"]
        email = contact["email"]
        phone = contact["phone"]

        if email:
            body = cfg["body"].format(
                first_name=first,
                youtube=RANCHPAD_YOUTUBE if project == "Ranch-Pad" else ""
            ).strip()
            success = _send_email(api_key, cfg["from_email"], email, cfg["subject"], body)
            if success:
                _record_send(project, email)
                if project == "pjroutes":
                    _mark_pjroutes_contacted(email)
                elif project == "Ranch-Pad":
                    _mark_ranchpad_sent(email)
                sent_count += 1
            else:
                skipped += 1
        elif phone:
            _log_phone(first, contact["last_name"], phone, contact["company"], project)
            phoned_count += 1

    lines = [f"**Outreach — {project}**"]
    lines.append(f"- Emails sent: {sent_count}")
    if phoned_count:
        lines.append(f"- Phone numbers logged (no email): {phoned_count} → {PHONE_LOG}")
    if skipped:
        lines.append(f"- Failed sends: {skipped}")
    remaining_contacts = len([c for c in all_contacts if not c["email"] and not c["phone"]])
    lines.append(f"- Uncontacted remaining: {len(to_contact) - sent_count}")

    if len(to_contact) == 0:
        lines.append("- All contacts exhausted — trigger Apify scrape for more.")

    return "\n".join(lines)
