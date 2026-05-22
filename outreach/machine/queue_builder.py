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
    Supplement with aircharterguide.com scrape if queue low.
    """
    leads = []
    skipped = 0
    phone_log = ROOT / ".claude/agents/phone_log.csv"
    for row in _read_csv(phone_log):
        proj = row.get("Project", "").strip().lower()
        if proj != "pjroutes":
            if proj:
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
        print(f"  [pjroutes] {skipped} rows skipped (wrong project tag)")

    added = enqueue("pjroutes", leads)
    state = load("pjroutes")
    print(f"[pjroutes] +{added} new leads | queue: {len(state['queue'])} total")

    if len(state["queue"]) < 200:
        print("[pjroutes] queue low — scraping aircharterguide.com...")
        _scrape_operators()

    return added

def _scrape_operators():
    """
    Scrapes Google Maps via Apify for Part 135 charter operators across US states.
    Uses compass/crawler-google-places actor — returns business emails directly.
    Falls back to static scrape of globalair.com if Apify key unavailable.
    """
    if APIFY_KEY:
        _apify_google_maps_operators()
    else:
        _globalair_scrape()

def _apify_google_maps_operators():
    """
    Pass 1: Apify Google Maps → operator names + website URLs.
    Pass 2: visit each website → extract emails via regex.
    """
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "beautifulsoup4", "-q"], check=False)
        from bs4 import BeautifulSoup

    import requests, re, time

    EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
    JUNK = {"example.com", "customer.com", "sentry.io", "wixpress.com", "cloudflare.com",
            "schema.org", "w3.org", "apple.com", "google.com", "microsoft.com",
            "yourdomain.com", "domain.com", "test.com", "email.com"}
    JUNK_LOCAL = {"example", "test", "noreply", "no-reply", "donotreply"}

    def _is_real_email(addr: str) -> bool:
        addr = addr.lower().strip()
        if "@" not in addr or len(addr) > 80:
            return False
        local, domain = addr.rsplit("@", 1)
        return domain not in JUNK and local not in JUNK_LOCAL and "." in domain

    STATES = [
        "Texas", "Florida", "California", "Colorado", "Nevada",
        "Arizona", "Georgia", "New York", "Illinois", "Ohio",
        "Virginia", "North Carolina", "Tennessee", "Montana", "Wyoming",
        "New Mexico", "Utah", "Idaho", "Oregon", "Washington",
    ]
    QUERIES = [f"Part 135 aircraft charter {s}" for s in STATES] + \
              [f"private jet charter operator {s}" for s in STATES[:10]]

    print(f"[pjroutes] pass 1 — Google Maps ({len(QUERIES)} queries via Apify async)...")
    items = []
    try:
        # Async run — no 300s sync timeout
        run_resp = requests.post(
            "https://api.apify.com/v2/acts/compass~crawler-google-places/runs",
            params={"token": APIFY_KEY},
            json={
                "searchStringsArray": QUERIES,
                "maxCrawledPlacesPerSearch": 20,
                "language": "en",
                "countryCode": "us",
                "scrapeContacts": True,
            },
            timeout=30,
        )
        if not run_resp.ok:
            print(f"  [warn] Apify start failed {run_resp.status_code}: {run_resp.text[:200]}")
            _globalair_scrape()
            return

        run_data = run_resp.json()["data"]
        run_id = run_data["id"]
        dataset_id = run_data["defaultDatasetId"]
        print(f"  [pjroutes] Apify run started: {run_id}")

        # Poll until finished (timeout after 20 min)
        for _ in range(120):
            time.sleep(10)
            try:
                status_r = requests.get(
                    f"https://api.apify.com/v2/actor-runs/{run_id}",
                    params={"token": APIFY_KEY}, timeout=30,
                )
                status = status_r.json()["data"]["status"]
            except Exception:
                continue  # network hiccup — retry
            if status == "SUCCEEDED":
                break
            if status in ("FAILED", "ABORTED", "TIMED-OUT"):
                print(f"  [warn] Apify run {status} — falling back to globalair")
                _globalair_scrape()
                return

        # Fetch dataset items
        items_r = requests.get(
            f"https://api.apify.com/v2/datasets/{dataset_id}/items",
            params={"token": APIFY_KEY, "limit": 5000}, timeout=60,
        )
        items = items_r.json() if items_r.ok else []
        print(f"[pjroutes] pass 1 complete: {len(items)} businesses found")

    except Exception as e:
        print(f"  [warn] Apify Google Maps failed: {e}")
        _globalair_scrape()
        return

    # ── Pass 2: visit each website and extract email ───────────────────────────
    print("[pjroutes] pass 2 — scraping operator websites for emails...")
    leads = []
    session = requests.Session()
    session.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124"

    for item in items:
        # Direct email from Google Maps (rare but use if present)
        gm_email = (item.get("email") or "").strip().lower()
        if _is_real_email(gm_email):
            leads.append({
                "email": gm_email,
                "name": "",
                "org": item.get("title", ""),
                "state": item.get("state", ""),
                "source": "google_maps_charter",
            })
            continue

        website = (item.get("website") or "").strip()
        if not website or ".gov" in website or ".edu" in website:
            continue

        try:
            r = session.get(website, timeout=10, allow_redirects=True)
            soup = BeautifulSoup(r.text, "html.parser")

            email = None
            # mailto links first
            ml = soup.find("a", href=re.compile(r"^mailto:", re.I))
            if ml:
                email = ml["href"][7:].split("?")[0].strip().lower()
            else:
                # try /contact page if no email on homepage
                contact_link = soup.find("a", href=re.compile(r"contact", re.I))
                if contact_link:
                    contact_url = contact_link["href"]
                    if not contact_url.startswith("http"):
                        from urllib.parse import urljoin
                        contact_url = urljoin(website, contact_url)
                    try:
                        rc = session.get(contact_url, timeout=8)
                        ml2 = BeautifulSoup(rc.text, "html.parser").find("a", href=re.compile(r"^mailto:", re.I))
                        if ml2:
                            candidate = ml2["href"][7:].split("?")[0].strip().lower()
                            if _is_real_email(candidate):
                                email = candidate
                        if not email:
                            for c in EMAIL_RE.findall(rc.text):
                                if _is_real_email(c):
                                    email = c.lower()
                                    break
                    except Exception:
                        pass

                if not email:
                    for c in EMAIL_RE.findall(r.text):
                        if _is_real_email(c):
                            email = c.lower()
                            break

            if _is_real_email(email or ""):
                leads.append({
                    "email": email,
                    "name": "",
                    "org": item.get("title", ""),
                    "state": item.get("state", ""),
                    "source": "charter_website",
                })
        except Exception:
            pass
        time.sleep(0.2)

    added = enqueue("pjroutes", leads)
    print(f"[pjroutes] Google Maps + website scrape: +{added} new operator contacts")

def _globalair_scrape():
    """
    Static fallback: scrapes globalair.com charter operator listings.
    This site renders server-side HTML — no JS required.
    """
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        import subprocess
        subprocess.run([sys.executable, "-m", "pip", "install", "beautifulsoup4", "-q"], check=False)
        from bs4 import BeautifulSoup

    import requests, re, time

    EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')
    JUNK = {"example.com", "sentry.io", "globalair.com", "wixpress.com", "cloudflare.com", "schema.org"}
    BASE = "https://www.globalair.com"

    session = requests.Session()
    session.headers["User-Agent"] = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124"

    print("[pjroutes] globalair.com fallback scrape...")
    operator_urls = set()

    # State-based listing pages on globalair
    us_states = [
        "alabama", "alaska", "arizona", "arkansas", "california", "colorado",
        "connecticut", "delaware", "florida", "georgia", "hawaii", "idaho",
        "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana",
        "maine", "maryland", "massachusetts", "michigan", "minnesota",
        "mississippi", "missouri", "montana", "nebraska", "nevada",
        "new-hampshire", "new-jersey", "new-mexico", "new-york",
        "north-carolina", "north-dakota", "ohio", "oklahoma", "oregon",
        "pennsylvania", "rhode-island", "south-carolina", "south-dakota",
        "tennessee", "texas", "utah", "vermont", "virginia", "washington",
        "west-virginia", "wisconsin", "wyoming",
    ]

    for state in us_states:
        try:
            url = f"{BASE}/charter/search/?country=US&state={state}"
            r = session.get(url, timeout=15)
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "html.parser")
            for a in soup.find_all("a", href=re.compile(r"/charter/[a-z0-9\-]+/", re.I)):
                href = a["href"]
                full = href if href.startswith("http") else BASE + href
                operator_urls.add(full)
            time.sleep(0.4)
        except Exception:
            continue

    print(f"[pjroutes] globalair: {len(operator_urls)} operator pages found")
    leads = []

    for url in list(operator_urls)[:300]:
        try:
            r = session.get(url, timeout=12)
            soup = BeautifulSoup(r.text, "html.parser")

            email = None
            ml = soup.find("a", href=re.compile(r"^mailto:", re.I))
            if ml:
                email = ml["href"][7:].split("?")[0].strip().lower()
            else:
                for c in EMAIL_RE.findall(r.text):
                    c = c.lower()
                    if c.split("@")[-1] not in JUNK and len(c) < 80:
                        email = c
                        break

            if not email:
                time.sleep(0.1)
                continue

            company = ""
            h1 = soup.find("h1")
            if h1:
                company = h1.get_text(strip=True)

            leads.append({
                "email": email,
                "name": "",
                "org": company,
                "source": "globalair",
            })
            time.sleep(0.2)
        except Exception:
            time.sleep(0.1)
            continue

    added = enqueue("pjroutes", leads)
    print(f"[pjroutes] globalair scrape complete: +{added} new operator contacts")

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
