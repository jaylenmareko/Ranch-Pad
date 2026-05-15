# Wagyu Wellness Co. — Project Context

## Status
Landing page mockup complete. Pending: product photos, real cart/checkout integration, domain.

## Stack
- Static HTML/CSS (single file `index.html`)
- Fonts: Inter (headings/body) + Playfair Display (logo, italic accents only)
- Served locally via `python -m http.server 3456` from this folder
- Images: hosted on `media.base44.com` (scraped from live site)

## Brand
- Owner: Emma Garrison
- Email: wagyuwellnessco@gmail.com
- Products: Tallow Balm $25 · Tallow Lotion $25 · The Fatty $15 · Tallow Soap $10 · Tallow Chapstick $5 · All in One Bundle $50
- Instagram: @wagyuwellnessco

## Design Reference
- **Primary aesthetic:** kongrolls.com — Inter 900, ALL CAPS headings, pure white bg, near-black text, zero border-radius, sharp layout
- **Warmth reference:** shoppuregood.com — earthy tones, family ranch story, cream sections
- **Color palette:** white `#FFFFFF` · cream `#F7F4EB` · dark `#111111` · body `#2B241C` · gold `#C9A96E` · sage `#6B8B5A`

---

## Copy Rules

**No manual line breaks (`<br>`) in headings unless intentional and reviewed.**
- Headlines should flow naturally via CSS — let `font-size` + container width control wrapping
- If a headline wraps badly at a specific viewport, fix with `max-width` or `font-size`, not `<br>`
- Only use `<br>` when a break is part of the *intended rhythm* of the line, confirmed visually

**Punctuation:**
- Use `:` (colon) to introduce a subtitle or elaboration — not `—` (em dash)
  - ✅ `The Ritual: Slow-Rendered. Never Rushed.`
  - ❌ `The Ritual — Slow-Rendered. Never Rushed.`
- Em dash `—` is for asides and interruptions only

**Sentence continuity:**
- If two sentences belong together on the same visual line, do not split with `<br>`
- Wrap the second clause in `<em>` for italic contrast if needed, but keep it inline

**Word choices:**
- Avoid clinical/technical anatomical terms where simpler language works
  - ✅ "highest-grade fat" ❌ "highest-grade kidney fat"
- Keep ingredient lists minimal — if it's not on the label, don't elaborate in copy
