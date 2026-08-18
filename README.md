# Everkind — Investor Site

A six-page public website for **Everkind** — an AI-powered wellbeing platform —
that doubles as the investor-relations hub for the company's proposed public
listing. Pure HTML + CSS + vanilla ES modules. **No build step, no framework,
no bundler.** Open a file, change a line, refresh.

> **This is the placeholder build.** Every value the client swaps lives in
> `assets/js/config.js`, and every unset value renders a visible, dashed
> **"Setup required"** card — never a broken embed, never a dead link. The
> client's logo pack and product renders were not supplied, so brand-styled
> placeholders stand in for them (each labelled on its face). See
> `assets/img/SOURCE-MAP.md` for the complete swap list.

## Run it locally

Any static file server works (ES modules and `fetch()` need http, not `file://`):

```bash
cd Everkind_Investor_website
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy

The repo deploys as-is to any static host (Vercel, Netlify, Pages).
No build command; output directory is the repo root.

## The one rule that governs content

**Nothing appears on this site that has not already been disclosed by news
release.** All copy ships marked `[DRAFT — PENDING SIGN-OFF]` in HTML comments.
Only a named executive promotes a line to `[APPROVED]`.

## How to change the things you'll actually change

### The hero headline (for the marketer)

Open `index.html`, search for `A private space to feel understood` — that's the
H1. The paragraph below it is the sub. Keep the `data-reveal` attributes; they
only control the animation.

### Add a news release (one file, two surfaces — **important**)

**`assets/data/news.json` drives BOTH the News Room and the "3 most recent"
block on the Investors page and Home.** Add the new release at the top of the
array and all three surfaces update:

```json
{ "date": "2026-09-01", "category": "Corporate",
  "title": "Everkind Announces …",
  "summary": "One line, figures quoted verbatim from the release.",
  "url": "https://…" }
```

Never paraphrase a number on an IR page — quote it verbatim from the release.
Two placeholder **transaction releases** sit at the top of the file with
`{{DATE}}` markers: fill those in first (the Listing-pending card, deck slide 13
and the corporate-information table all need one to cite).

### Swap the deck

1. Replace `assets/docs/everkind-investor-deck.pdf` with the approved PDF.
2. Update `DECK_VERSION` in `assets/js/config.js` (e.g. `"September 2026"`).
3. Edit `assets/data/deck.json` to update the on-page slides — they're plain
   text in JSON, no design tool needed. **Slide 2 is the cautionary statement;
   never reorder it.**

### Calm the motion (or turn it off)

- Site visitors: the **"Motion"** toggle in the footer, or their OS
  reduced-motion setting — both produce a complete, still site.
- Globally: in `assets/js/config.js`, set `MOTION.intensity` lower (0–1) or
  `MOTION.forceCssBackground: true` to never load WebGL.
- Every JS module has a `/* TUNE: */` block at the top listing the three or
  four numbers worth changing.

### Fill in the placeholders

Work through **`SETUP_CHECKLIST.md`** — every `{{PLACEHOLDER}}` in
`assets/js/config.js` is explained there (Pipedrive form URL, Calendly link,
TradingView symbol, privacy threshold `MIN_COHORT`, app-store links, legal
URLs). The site works before any of them are set; each missing one shows a
"Setup required" card so gaps are impossible to miss.

**`TRADING_LIVE` stays `false`** until the resulting issuer actually trades
under its own symbol. While false, the Investors page shows a designed
"Listing pending" card instead of a chart — that is correct, not broken.

## Repo layout

```
index/company/product/investors/news/contact/404.html
assets/css/    tokens → base → components → animations → pages
assets/js/     config.js (the ONLY place placeholders live) + 15 modules,
               each with a header comment and a /* TUNE: */ block
assets/data/   news.json · team.json · deck.json
assets/img/    product placeholders + og-default.png + SOURCE-MAP.md
assets/logo/   placeholder lockups (swap per SOURCE-MAP.md)
assets/docs/   everkind-investor-deck.pdf (placeholder)
```

## Still needed before launch

- Real logo pack + ten product render PNGs (then 1x/2x WebP) — see
  `assets/img/SOURCE-MAP.md`
- **A real Voice Mode capture** — the Product page deliberately uses an
  abstract waveform because no supplied render shows Voice Mode
- Transaction release dates/URLs in `news.json`
- The three proof-strip figures (17K / 25% / 365) sourced, dated and signed
  off — **or removed**; none appears in any release currently in `news.json`
- Every `{{PLACEHOLDER}}` in `config.js`, per `SETUP_CHECKLIST.md`
- Legal + sponsor/exchange review (see SETUP_CHECKLIST "Before you launch")
