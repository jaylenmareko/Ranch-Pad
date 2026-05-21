#!/usr/bin/env python3
"""
queue_builder.py — seeds lead queues for all 3 projects.
Run: python queue_builder.py [all|ranchpad|pjroutes|topiclaunch]
Auto-triggered by sender.py when queue drops below threshold.
"""
import os, sys, csv, json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")
sys.path.insert(0, str(Path(__file__).parent))
from lib.state import enqueue, load

ROOT = Path(__file__).parent.parent.parent  # DoWhatever root
PROJECTS_BASE = ROOT / "projects" / "business"
APIFY_KEY = os.getenv("APIFY_API_KEY", "")

# ─── helpers ─────────────────────────────────────────────────────────────────

def _read_csv(path: Path) -> list:
    if not path.exists():
        return []
    try:
        with open(path, newline="", encoding="utf-8-sig") as f:
            return list(csv.DictReader(f))
    except Exception as e:
        print(f"  [warn] could not read {path}: {e}")
        return []

def _norm(row: dict, *keys) -> str:
    for k in keys:
        v = row.get(k, "").strip()
        if v:
            return v
    return ""

# ─── Ranch-Pad ───────────────────────────────────────────────────────────────

def build_ranchpad():
    """
    Targets: ag creators + NEFB farm bureau contacts.
    FFA advisor CSVs are intentionally excluded.
    """
    leads = []

    # NEFB regional managers
    nefb_dir = PROJECTS_BASE / "Ranch-Pad/outreach/farm-bureau/nefb/data"
    for csv_path in (nefb_dir.glob("*.csv") if nefb_dir.is_dir() else []):
        for row in _read_csv(csv_path):
            email = _norm(row, "Email", "email")
            if email:
                leads.append({
                    "email": email,
                    "name": " ".join(filter(None, [_norm(row,'First Name','first_name'), _norm(row,'Last Name','last_name')])),
                    "org": _norm(row, "Organization", "org", "Company"),
                    "source": "nefb",
                    "state": _norm(row, "State", "state"),
                })

    # Existing ag creators CSV
    creators_csv = PROJECTS_BASE / "Ranch-Pad/outreach/creators/data/creators.csv"
    for row in _read_csv(creators_csv):
        email = _norm(row, "Email", "email")
        if email:
            leads.append({
                "email": email,
                "name": " ".join(filter(None, [_norm(row,'First Name','first_name'), _norm(row,'Last Name','last_name')])) or _norm(row, "Name", "name", "Creator"),
                "org": _norm(row, "Platform", "platform", "Channel"),
                "source": "creators_csv",
            })

    added = enqueue("ranchpad", leads)
    state = load("ranchpad")
    print(f"[ranchpad] +{added} new leads | queue: {len(state['queue'])} total")

    # Trigger Apify if queue still low
    if len(state["queue"]) < 200 and APIFY_KEY:
        print("[ranchpad] queue low — scraping ag creators via Apify...")
        _apify_ag_creators()

    return added

def _apify_ag_creators():
    import requests
    keywords = ["cattle ranching", "livestock farming", "beef producer", "ranch life"]
    leads = []
    for kw in keywords[:2]:
        try:
            resp = requests.post(
                "https://api.apify.com/v2/acts/bernardo_human~youtube-scraper/run-sync-get-dataset-items",
                params={"token": APIFY_KEY, "timeout": 90},
                json={"searchKeywords": [kw], "maxResults": 100,
                      "minSubscriberCount": 500, "maxSubscriberCount": 500000},
                timeout=180,
            )
            if resp.ok:
                for item in resp.json():
                    email = item.get("contactEmail", "").strip()
                    if email:
                        leads.append({
                            "email": email,
                            "name": item.get("channelName", ""),
                            "org": f"YouTube — {item.get('subscriberCount','')} subs",
                            "source": f"apify_youtube_{kw.replace(' ','_')}",
                        })
        except Exception as e:
            print(f"  [warn] Apify ag scrape failed for '{kw}': {e}")
    added = enqueue("ranchpad", leads)
    print(f"[ranchpad] Apify added {added} ag creator contacts")

# ─── PJRoutes ────────────────────────────────────────────────────────────────

def build_pjroutes():
    """
    Targets: Part 135 charter operators.
    Source: .claude/agents/phone_log.csv (rows where Project == pjroutes).
    Supplement with Apify aircharterguide if queue low.
    """
    leads = []
    skipped = 0
    phone_log = ROOT / ".claude/agents/phone_log.csv"
    for row in _read_csv(phone_log):
        proj = row.get("Project", "").strip().lower()
        if proj != "pjroutes":
            if proj:  # has a project tag but it's not pjroutes
                skipped += 1
            continue
        email = _norm(row, "Email", "email")
        if not email:
            continue
        leads.append({
            "email": email,
            "name": " ".join(filter(None, [_norm(row,'First Name','first_name'), _norm(row,'Last Name','last_name')])),
            "org": _norm(row, "Company", "company"),
            "source": "faa_phone_log",
        })

    if skipped:
        print(f"  [pjroutes] {skipped} rows skipped (wrong project tag — check capitalization)")

    added = enqueue("pjroutes", leads)
    state = load("pjroutes")
    print(f"[pjroutes] +{added} new leads | queue: {len(state['queue'])} total")

    if len(state["queue"]) < 200 and APIFY_KEY:
        print("[pjroutes] queue low — scraping aircharterguide via Apify...")
        _apify_operators()

    return added

def _apify_operators():
    """
    TODO: Implement two-pass Apify scrape:
    Pass 1 — collect operator detail page URLs from listing pages
    Pass 2 — visit each detail page and extract email/name/company
    For now, log clearly that this needs implementation.
    """
    print("[pjroutes] WARNING: Apify operator scrape not yet implemented — add APIFY key + implement two-pass scrape")
    print("[pjroutes] For now, add operator contacts manually to state/pjroutes.json queue[]")

# ─── TopicLaunch ─────────────────────────────────────────────────────────────

def build_topiclaunch():
    """
    Targets: creators 1K-100K audience.
    Source 1: tl_emails.json (2,464 existing contacts).
    Source 2: Apify YouTube/TikTok when queue low.
    """
    leads = []

    tl_json = PROJECTS_BASE / "TopicLaunch/outreach/tl_emails.json"
    if tl_json.exists():
        try:
            with open(tl_json, encoding="utf-8-sig") as f:
                raw = f.read()
            # file may have a header line before the JSON array
            json_start = raw.find("[")
            if json_start == -1:
                json_start = raw.find("{")
            contacts = json.loads(raw[json_start:] if json_start != -1 else raw)
            if isinstance(contacts, list):
                for c in contacts:
                    # plain string list: ["email@x.com", ...]
                    if isinstance(c, str):
                        if "@" in c:
                            leads.append({"email": c.strip(), "name": "", "org": "", "source": "tl_existing_list"})
                        continue
                    email = _norm(c, "email", "Email")
                    if email:
                        leads.append({
                            "email": email,
                            "name": _norm(c, "name", "Name", "creator", "Creator"),
                            "org": _norm(c, "platform", "Platform", "channel", "Channel"),
                            "source": "tl_existing_list",
                        })
            elif isinstance(contacts, dict):
                # handle {email: name} format
                for email, name in contacts.items():
                    if "@" in email:
                        leads.append({"email": email, "name": str(name), "org": "", "source": "tl_existing_list"})
        except Exception as e:
            print(f"  [warn] could not read tl_emails.json: {e}")

    added = enqueue("topiclaunch", leads)
    state = load("topiclaunch")
    print(f"[topiclaunch] +{added} new leads | queue: {len(state['queue'])} total")

    if len(state["queue"]) < 200 and APIFY_KEY:
        print("[topiclaunch] queue low — scraping creators via Apify...")
        _apify_creators()

    return added

def _apify_creators():
    import requests
    niches = ["fitness motivation", "health and wellness", "business tips", "AI productivity"]
    leads = []
    for niche in niches[:2]:
        try:
            resp = requests.post(
                "https://api.apify.com/v2/acts/bernardo_human~youtube-scraper/run-sync-get-dataset-items",
                params={"token": APIFY_KEY, "timeout": 90},
                json={"searchKeywords": [niche], "maxResults": 75,
                      "minSubscriberCount": 1000, "maxSubscriberCount": 100000},
                timeout=180,
            )
            if resp.ok:
                for item in resp.json():
                    email = item.get("contactEmail", "").strip()
                    if email:
                        leads.append({
                            "email": email,
                            "name": item.get("channelName", ""),
                            "org": f"YouTube — {item.get('subscriberCount','')} subs",
                            "source": f"apify_youtube_{niche.replace(' ','_')}",
                        })
        except Exception as e:
            print(f"  [warn] Apify creator scrape failed for '{niche}': {e}")
    added = enqueue("topiclaunch", leads)
    print(f"[topiclaunch] Apify added {added} creator contacts")

# ─── main ────────────────────────────────────────────────────────────────────

BUILDERS = {
    "ranchpad": build_ranchpad,
    "pjroutes": build_pjroutes,
    "topiclaunch": build_topiclaunch,
}

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    if target == "all":
        for fn in BUILDERS.values():
            fn()
    elif target in BUILDERS:
        BUILDERS[target]()
    else:
        print(f"Unknown project: {target}. Use: all | ranchpad | pjroutes | topiclaunch")
        sys.exit(1)
