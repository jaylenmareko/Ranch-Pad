"""
World Briefing -- runs every agent cycle.

Single Claude call with multiple web searches covering:
  - Stock market snapshot (S&P 500, Nasdaq, Dow, crypto)
  - Top world + business news
  - LinkedIn trends
  - Business opportunities from what's trending
"""

import anthropic

PROMPT = """Search the web and give Jaylen Davis his daily world briefing. Cover all four sections:

**1. MARKETS** — S&P 500, Nasdaq, Dow Jones today (current price + % change). Bitcoin. Any major movers or macro news driving the market (rates, inflation, geopolitics). Exact numbers only.

**2. TOP NEWS** — Search ABC News, Reuters, Wall Street Journal, or Bloomberg for the 5 most important business and world headlines today. Company names, numbers, why each story matters to a founder/investor.

**3. LINKEDIN TRENDING** — What topics are professionals and entrepreneurs most engaged with on LinkedIn right now? Any viral content, debates, or movements? What are business leaders talking about?

**4. AI TOOLS** — Search for the top new AI tools launched or trending in the last 7 days. What dropped that's actually worth using? Focus on tools relevant to: outreach automation, market research, content creation, coding, productivity, or anything a solo entrepreneur would find useful. For each: what it does, cost (free/paid), and why it's worth trying.

**5. OPPORTUNITIES** — Based on what is trending in markets, news, and business right now, identify 3 specific opportunities a solo entrepreneur or small startup could act on in the next 30-90 days. For each: what it is, who pays, rough revenue potential, why right now. Be specific -- no generic advice.

Format: use the bold headers above. Keep each section tight and punchy. Numbers and names over vague statements."""


def get_world_briefing(client: anthropic.Anthropic) -> str:
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 15}],
            messages=[{"role": "user", "content": PROMPT}]
        )
        parts = [b.text for b in resp.content if hasattr(b, "text") and b.text]
        result = "\n".join(parts).strip()
        return f"**World Briefing**\n\n{result}" if result else "**World Briefing** — no results"
    except Exception as e:
        return f"**World Briefing** — unavailable: {e}"
