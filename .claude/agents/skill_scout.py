"""
Skill Scout -- finds and installs high-quality Claude Code skills from GitHub.

Discovery strategy:
  1. Curated trusted repos (known good, no auth needed, pull specific skills)
  2. GitHub repo search for additional sources (public API, no auth)
  3. Both check skills/ and .claude/skills/ directory conventions

Quality bar:
  - Source repo must be trusted OR meet star/freshness thresholds
  - SKILL.md must pass structural validation
  - Claude (Haiku) rates it relevant to Jaylen's actual work

Usage:
    from skill_scout import scout_and_install
    report = scout_and_install(client, dry_run=False)

Standalone:
    python skill_scout.py [--dry-run]
"""

import argparse
import os
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import anthropic
import requests

ROOT       = Path(__file__).parent.parent.parent  # DoWhatever/
SKILLS_DIR = ROOT / ".claude" / "skills"

GITHUB_API   = "https://api.github.com"
GITHUB_RAW   = "https://raw.githubusercontent.com"
MAX_AGE_DAYS = 365
MIN_STARS    = 8  # for discovered repos (curated ones bypass this)

# Context used when asking Claude if a skill is relevant
JAYLEN_CONTEXT = (
    "Jaylen Davis is a software entrepreneur running two products:\n"
    "1. RanchPad -- livestock record-keeping SaaS for ranchers and FFA advisors\n"
    "2. PJRoutes -- empty-leg private jet marketplace for small Part 135 operators\n"
    "Daily work: outreach automation, market research, code health, email campaigns, "
    "git/GitHub, Next.js, Python, business strategy.\n"
    "Skills are Claude Code slash-commands. Useful ones save time on recurring tasks."
)

# ── Curated trusted sources ───────────────────────────────────────────────────
# These bypass star/age checks — we know they're high quality.
# Format: (repo_full_name, branch, skills_dir, relevant_skill_names_or_None_for_all)
TRUSTED_SOURCES = [
    (
        "affaan-m/everything-claude-code",
        "main",
        "skills",
        # Specifically relevant to Jaylen's work — don't pull all 230
        [
            "market-research", "investor-outreach", "lead-intelligence",
            "email-ops", "deep-research", "research-ops", "seo",
            "github-ops", "git-workflow", "data-scraper-agent",
            "production-audit", "security-review", "deployment-patterns",
            "content-engine", "autonomous-agent-harness", "continuous-agent-loop",
            "agent-introspection-debugging", "cost-tracking", "exa-search",
        ],
    ),
    (
        "JuliusBrussee/caveman",
        "main",
        "skills",
        None,  # pull all (small repo, all relevant)
    ),
]

# ── GitHub API helper ─────────────────────────────────────────────────────────

_RATE_LIMITED = False


def _gh(url: str, params: dict = None) -> Optional[dict]:
    global _RATE_LIMITED
    if _RATE_LIMITED:
        return None
    token = os.environ.get("GITHUB_TOKEN")
    headers = {"Accept": "application/vnd.github+json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        r = requests.get(url, headers=headers, params=params, timeout=12)
        if r.status_code == 200:
            return r.json()
        if r.status_code in (403, 429):
            _RATE_LIMITED = True
            return None
        return None
    except Exception:
        return None


def _fetch_raw(url: str) -> Optional[str]:
    try:
        r = requests.get(url, timeout=12)
        return r.text if r.status_code == 200 else None
    except Exception:
        return None


# ── Validation ────────────────────────────────────────────────────────────────

def _is_valid_skill(content: str) -> bool:
    if not content or len(content) < 80:
        return False
    if content.strip().splitlines().__len__() < 5:
        return False
    has_trigger = any(
        kw in content.lower()
        for kw in ("use when", "trigger", "invoke", "when the user", "when user", "use this")
    )
    return has_trigger


def _is_installed(skill_name: str) -> bool:
    return (SKILLS_DIR / skill_name / "SKILL.md").exists()


def _is_fresh(updated_at: str) -> bool:
    try:
        dt  = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
        age = (datetime.now(timezone.utc) - dt).days
        return age <= MAX_AGE_DAYS
    except Exception:
        return True


# ── Discovery: curated sources ────────────────────────────────────────────────

def _from_trusted_source(
    repo: str, branch: str, skills_dir: str, allowlist: Optional[list[str]]
) -> list[dict]:
    candidates = []

    # List the skills directory
    contents = _gh(f"{GITHUB_API}/repos/{repo}/contents/{skills_dir}")
    if not contents or not isinstance(contents, list):
        return candidates

    for entry in contents:
        if entry.get("type") != "dir":
            continue
        name = entry.get("name", "")
        if not name or name.startswith("."):
            continue
        if allowlist and name not in allowlist:
            continue

        raw_url = f"{GITHUB_RAW}/{repo}/{branch}/{skills_dir}/{name}/SKILL.md"
        candidates.append({
            "skill_name":  name,
            "raw_url":     raw_url,
            "repo":        repo,
            "trusted":     True,
            "description": "",
        })

    return candidates


# ── Discovery: GitHub search (bonus finds) ───────────────────────────────────

DISCOVERY_QUERIES = [
    "SKILL.md claude skills path:skills in:path",
    "claude-code skill SKILL.md",
]

_AUTHOR_CACHE: dict[str, bool] = {}


def _author_ok(login: str) -> bool:
    if login in _AUTHOR_CACHE:
        return _AUTHOR_CACHE[login]
    data = _gh(f"{GITHUB_API}/users/{login}")
    if not data:
        _AUTHOR_CACHE[login] = True  # fail open when rate limited
        return True
    ok = data.get("public_repos", 0) >= 5 or data.get("followers", 0) >= 30
    _AUTHOR_CACHE[login] = ok
    return ok


def _from_discovery() -> list[dict]:
    seen   = set(r for r, *_ in TRUSTED_SOURCES)
    pool   = []

    for query in DISCOVERY_QUERIES:
        data = _gh(f"{GITHUB_API}/search/repositories", params={
            "q": query, "sort": "stars", "order": "desc", "per_page": 10,
        })
        time.sleep(1)
        if not data or "items" not in data:
            continue
        for repo in data["items"]:
            rname = repo.get("full_name", "")
            if not rname or rname in seen:
                continue
            seen.add(rname)
            if repo.get("fork"):
                continue
            if repo.get("stargazers_count", 0) < MIN_STARS:
                continue
            if not _is_fresh(repo.get("updated_at", "")):
                continue
            pool.append({
                "repo":           rname,
                "branch":         repo.get("default_branch", "main"),
                "owner":          rname.split("/")[0],
                "stars":          repo.get("stargazers_count", 0),
                "description":    repo.get("description", ""),
            })

    candidates = []
    for r in pool:
        # Check both conventions
        for skills_dir in ("skills", ".claude/skills"):
            contents = _gh(f"{GITHUB_API}/repos/{r['repo']}/contents/{skills_dir}")
            time.sleep(0.3)
            if not contents or not isinstance(contents, list):
                continue
            for entry in contents:
                if entry.get("type") != "dir":
                    continue
                name = entry.get("name", "")
                if not name or name.startswith("."):
                    continue
                raw_url = (
                    f"{GITHUB_RAW}/{r['repo']}/{r['branch']}/{skills_dir}/{name}/SKILL.md"
                )
                candidates.append({
                    "skill_name":  name,
                    "raw_url":     raw_url,
                    "repo":        r["repo"],
                    "owner":       r["owner"],
                    "stars":       r["stars"],
                    "trusted":     False,
                    "description": r["description"],
                })
            break  # found one dir convention, don't double-count

    return candidates


# ── Relevance check ───────────────────────────────────────────────────────────

def _is_relevant(content: str, name: str, client: anthropic.Anthropic) -> bool:
    try:
        resp = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=10,
            messages=[{
                "role": "user",
                "content": (
                    f"{JAYLEN_CONTEXT}\n\n"
                    f"Skill name: {name}\n"
                    f"First 600 chars:\n{content[:600]}\n\n"
                    "Useful for this person's daily work? YES or NO only."
                )
            }]
        )
        return resp.content[0].text.strip().upper().startswith("YES")
    except Exception:
        return True


# ── Install ───────────────────────────────────────────────────────────────────

def _install(name: str, content: str):
    d = SKILLS_DIR / name
    d.mkdir(parents=True, exist_ok=True)
    (d / "SKILL.md").write_text(content, encoding="utf-8")


# ── Main ──────────────────────────────────────────────────────────────────────

def scout_and_install(client: anthropic.Anthropic = None, dry_run: bool = False) -> str:
    lines = ["**Skill Scout**"]

    # Build candidate list: curated first, then discovered
    candidates = []
    for repo, branch, skills_dir, allowlist in TRUSTED_SOURCES:
        candidates.extend(_from_trusted_source(repo, branch, skills_dir, allowlist))
        time.sleep(0.3)

    discovered = _from_discovery()
    candidates.extend(discovered)

    if not candidates:
        lines.append("- No candidates found")
        return "\n".join(lines)

    lines.append(f"- {len(candidates)} candidate(s) (curated + discovered), evaluating...")

    installed = skipped = 0
    limit     = 10

    for c in candidates:
        if installed >= limit:
            break

        name = c["skill_name"]

        if _is_installed(name):
            skipped += 1
            continue

        content = _fetch_raw(c["raw_url"])
        if not content or not _is_valid_skill(content):
            skipped += 1
            continue

        # Author check (skip for trusted sources)
        if not c.get("trusted") and not _author_ok(c.get("owner", "")):
            skipped += 1
            lines.append(f"- Skipped `{name}` -- author not credible")
            continue

        # Claude relevance check
        if client and not _is_relevant(content, name, client):
            skipped += 1
            lines.append(f"- Skipped `{name}` -- not relevant to your work")
            continue

        if not dry_run:
            _install(name, content)
            lines.append(f"- Installed `{name}` from `{c['repo']}`")
        else:
            lines.append(f"- [dry run] Would install `{name}` from `{c['repo']}`")

        installed += 1
        time.sleep(0.3)

    lines.append(f"- Done: {installed} installed, {skipped} skipped")

    if _RATE_LIMITED:
        lines.append(
            "- GitHub rate limit hit. Set GITHUB_TOKEN env var "
            "(github.com/settings/tokens) for 5000 req/hr vs 60/hr."
        )

    if installed > 0 and not dry_run:
        lines.append(f"- Saved to: {SKILLS_DIR}")
        lines.append("- Restart Claude Code to activate new skills.")

    return "\n".join(lines)


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    client  = anthropic.Anthropic(api_key=api_key) if api_key else None
    if not client:
        print("[skill_scout] No API key -- skipping relevance filter.")

    print(scout_and_install(client, dry_run=args.dry_run))
