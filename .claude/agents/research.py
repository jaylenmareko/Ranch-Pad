"""
Market research module. Uses Claude web search to pull market intel per project.
Also generates pivot opportunities and monetization angles.
"""

import anthropic

QUERIES = {
    "Ranch-Pad": (
        "Search for the latest news on: livestock management software market 2026, "
        "cattle ranch technology trends, agricultural record-keeping apps, "
        "and any competitor moves in the ranch/farm management software space. "
        "What are ranchers paying? Any notable funding rounds or new players?"
    ),
    "pjroutes": (
        "Search for the latest news on: empty leg private jet market 2026, "
        "charter flight operator trends, FBO industry updates, "
        "and any new platforms or competitors entering the empty-leg booking space. "
        "Any pricing shifts or demand changes in private aviation?"
    ),
}

PIVOT_PROMPTS = {
    "Ranch-Pad": (
        "Based on the livestock management software market and the current model of RanchPad "
        "(a $12/mo ranch record-keeping app targeting ranchers and FFA advisors in Kansas and surrounding states), "
        "identify 2-3 realistic pivots or adjacent opportunities that could generate more revenue "
        "or serve clearer, more urgent demand. For each: what is the pivot, who pays, how much could they pay, "
        "and why it makes more money than the current model. Be specific — no generic advice."
    ),
    "pjroutes": (
        "Based on the current empty-leg private jet marketplace model (PJRoutes — operators list flights, "
        "passengers book, no membership fees, platform takes a cut on top of operator price), "
        "identify 2-3 realistic pivots or adjacent opportunities that could generate more revenue "
        "or serve clearer, more urgent demand. For each: what is the pivot, who pays, how much could they pay, "
        "and why it makes more money than the current model. Be specific — no generic advice."
    ),
}


def get_market_intel(project: str, client: anthropic.Anthropic) -> str:
    query = QUERIES.get(project)
    if not query:
        return ""

    sections = []

    # Market intel via web search
    try:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 5}],
            messages=[{
                "role": "user",
                "content": (
                    f"{query}\n\n"
                    "Return exactly 5 bullets. Each bullet = one data point that moves the needle "
                    "for a founder making business decisions. No fluff. Be specific — numbers, names, dates."
                )
            }]
        )
        parts = [b.text for b in response.content if hasattr(b, "text") and b.text]
        if parts:
            sections.append("**Market Intel**\n" + "\n".join(parts))
    except Exception as e:
        sections.append(f"**Market Intel** — search unavailable: {e}")

    # Pivot + monetization analysis
    pivot_prompt = PIVOT_PROMPTS.get(project)
    if pivot_prompt:
        try:
            resp = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                messages=[{
                    "role": "user",
                    "content": (
                        f"{pivot_prompt}\n\n"
                        "Format: for each pivot, one short paragraph. "
                        "Lead with the opportunity name in bold, then who pays, how much, "
                        "and why it beats the current model. "
                        "Honest and direct — if a pivot is weak, say so and why."
                    )
                }]
            )
            pivot_text = resp.content[0].text.strip()
            sections.append("**Pivot Opportunities**\n" + pivot_text)
        except Exception as e:
            sections.append(f"**Pivot Opportunities** — unavailable: {e}")

    return "\n\n".join(sections)
