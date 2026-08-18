# Everkind Investor Site — Setup Checklist

Fill these in before or right after running the build prompt. Everything lives in one file: `assets/js/config.js`.

Anything left as `{{PLACEHOLDER}}` still builds — that block renders a dashed "Setup required" card instead of a broken embed. So you can ship, see exactly what's missing, and fill it in as it arrives.

---

## 1. Site URLs

| Field | Notes |
|---|---|
| `SITE_URL` | Required. Canonical tags, Open Graph, and `sitemap.xml` all derive from it. |
| `PRIVACY_URL` | Required. The site makes strong privacy claims in four places and every one of them links here. |
| `TERMS_URL`, `SUPPORT_URL`, `ACCESSIBILITY_URL` | Footer links. Point them at the existing everkind.com pages if you don't want new ones. |

Unset links render a setup card rather than a dead `#`, so you'll see immediately what's outstanding.

---

## 2. Market data — TradingView

| Field | Where to get it |
|---|---|
| `TRADINGVIEW_SYMBOL` | Format is `EXCHANGE:TICKER`. **Search the ticker on tradingview.com and copy the symbol exactly as it appears at the top-left of the chart** — capital pool company tickers don't always resolve the way you'd guess. |
| `EXCHANGE_LABEL` | Display name, e.g. "TSX Venture Exchange". |
| `TICKER_LABEL` | Just the ticker. |
| `TRADING_LIVE` | **Leave `false` until the resulting issuer is actually trading under its own symbol.** |

**On `TRADING_LIVE`.** The RTO with AF2 Capital Corp. means the currently-listed vehicle is the capital pool company, not the resulting issuer. Rendering that chart under an "Everkind stock" heading is misleading and is the kind of thing that draws regulator attention. While it's `false` the page shows a designed "Listing pending" card. Flip it on the first day of trading under the new symbol, and update the symbol at the same time.

No account or API key needed. The widget is free and the data is delayed. **TradingView's attribution link must stay in the markup** — their terms require it.

---

## 3. Pipedrive web form

1. Pipedrive → **Leads** → **Web forms**
2. Create or open the form. Suggested fields: Name, Email, Company, Investor type (Institutional / Retail / Analyst / Other), Message.
3. Set it to create a **Lead**, and give it a distinct label or pipeline so IR enquiries don't land in the B2B sales stages.
4. **Share** → **Embed** → copy the URL: `https://webforms.pipedrive.com/f/XXXXXXXXXXXXXXXXXXXX`
5. Paste **only that URL** into `PIPEDRIVE_FORM_URL`. Not the `<script>` block — the build already has the loader.

The same form is used in three places (Investors sidebar, News Room rail, Contact). To track them separately, create three forms and split the config value into three fields — a five-minute change.

---

## 4. Calendly

1. Open the event type IR should book against. 30 minutes is the usual choice.
2. Copy the full public URL: `https://calendly.com/<user-or-team>/<event>`
3. Paste into `CALENDLY_URL`.

If IR is more than one person, use a **round-robin team event** rather than an individual link.

**Two things worth knowing before you're surprised by them:**

- **Brand colours require a paid plan.** `background_color`, `text_color` and `primary_color` are ignored on Calendly's free tier — the embed will render light on a dark page. The build wraps it in a card designed to survive that, but if you want the dark embed you need Standard or above.
- **On mobile it opens as a popup**, not a 700px inline frame. A full-height iframe on a phone is a scroll trap.

---

## 5. Contact details

| Field | Notes |
|---|---|
| `IR_EMAIL` | Pre-filled `investors@everkind.com` (currently listed on everkind.com/investors). **Send a test message to confirm it's monitored** before launch. |
| `GENERAL_EMAIL` | General enquiries. |
| `MEDIA_EMAIL` | Press. Can be the same as general. |
| `IR_PHONE`, `HQ_ADDRESS` | Optional. Leave blank and the blocks disappear cleanly. |

---

## 6. Privacy reporting threshold — `MIN_COHORT`

This one is a policy decision, not a lookup, and it's the only config value that also constrains the product.

The site states in three places that organizations see aggregate engagement and never an individual. **Aggregate data for a three-person team is individual data.** So the copy commits to a minimum: *"Aggregate reporting is available only where at least {{MIN_COHORT}} people are enrolled."*

Pick the number your product actually enforces — 20 or 25 is typical. If the product doesn't enforce a minimum yet, that's worth fixing before the site makes the claim, because it's an enforceable representation rather than a marketing line.

---

## 7. The deck

| Field | Notes |
|---|---|
| `DECK_PDF` | Drop the approved PDF at `assets/docs/everkind-investor-deck.pdf`. A placeholder ships so the download button is testable immediately. |
| `DECK_VERSION` | Shown next to the download button, e.g. "August 2026". Investors check this. |
| `assets/data/deck.json` | The clickable on-page deck. Slides are **live HTML, not images** — editable, selectable, translatable, screen-reader accessible. Edit the JSON to change a slide; no design tool needed. |

Slide 2 is the cautionary statement. Don't reorder it.

---

## 8. News releases — `assets/data/news.json`

One file drives both the News Room and the "3 most recent" block at the top of the Investors page. Add a release at the top of the array and both surfaces update.

Eight releases ship pre-populated from the public record (Aug 17 2026 back to Jul 16 2025). Three things to do:

1. **Add the URLs.** Every `"url"` is `{{URL}}`.
2. **Write the summaries marked `{{NEEDS SIGN-OFF}}`** — the financing releases. Any dollar figure, share count, or price must be quoted **verbatim** from the release. Don't paraphrase numbers on an IR page.
3. **Add the transaction releases.** The AF2 Capital letter of intent, the definitive agreement, and anything since are not in the list — and three things on the site need to link to one: the "Listing pending" card, deck slide 13, and the corporate-information table. Right now the most compliance-sensitive element on the site has no source to cite.

---

## 9. Team — `assets/data/team.json`

Pre-populated from the public record:

- **Management:** Harrison Newlands (CEO), Supreet Pal Singh (CTO), Brien Stelzer (COO), Jonathan Held (CFO & Director)
- **Board:** Mark Saunders, Nagar Rahmani, Dr. Hamilton Jeyaraj, Jonathan Held
- **Clinical advisors:** Dr. Hamilton Jeyaraj MD, David Drapkin LCSW, Dr. Niki Fitzgerald PhD C.Psych.

**Verify every title against the most recent filing.** These come from the definitive-agreement release, and titles shift between announcement and closing.

**Two specific things to check:**

- **Dr. Hamilton Jeyaraj is both a director and a clinical advisor.** That dual role is a related-party disclosure item — the build states it on the page, but confirm the framing with counsel.
- **Professional designations.** LCSW is a US credential, and "Clinical Psychotherapist" is not a protected title in Ontario (CRPO regulates "Psychotherapist"). Confirm each designation is current and correctly rendered for the jurisdiction where that person practises. Publishing credentials next to a wellbeing product carries real exposure.

Bios are all `{{BIO}}`. Headshots are optional — leave `"photo": ""` and the card renders a branded initials avatar at exactly the dimensions a real photo will take, so adding one later moves nothing.

---

## 10. App store and social

`APP_STORE_URL`, `PLAY_STORE_URL`, `LINKEDIN_URL`. Straightforward, but "Get the app" is on every page — leaving these blank means eight setup cards where CTAs should be.

---

## 11. Colours — already done

No hex codes to fill in. These were extracted from the actual logo files and product renders:

| Token | Hex | What it is |
|---|---|---|
| `--ek-plum` | `#4D3864` | The wordmark colour |
| `--ek-violet-deep` | `#5E1AA3` | Logo mark gradient, dark end |
| `--ek-violet` | `#7430A1` | Logo mark gradient, mid — the primary accent |
| `--ek-orchid` | `#A96BAD` | Logo mark gradient, light end |
| `--ek-lilac` | `#C9A7E6` | In-app light purple |
| `--ek-blush` | `#F2C6DC` | In-app pink — the bloom colour |
| `--ek-cream` | `#FDF6F4` | In-app warm off-white |
| `--ek-ink` | `#0C0710` | Near-black plum — the site's ground |

Two notes:

- **The older LinkedIn design-prompts doc describes a "warm sunrise palette — golds, corals, gentle oranges."** That was a placeholder guess written before anyone opened the logo files. The real brand is purple. If you reuse that doc for anything else, fix the palette line first.
- `--ek-violet` on the dark card surface measures 2.4:1 and fails accessibility for meaningful borders. The build uses `--ek-orchid` for anything a border needs to communicate, and keeps violet for glow. Don't "fix" it back.

Type is Crimson Pro (serif headlines) + Figtree (sans body), both free on Google Fonts, matching the app.

---

## 12. Before you launch

**Content**
- [ ] Every `{{PLACEHOLDER}}` filled or deliberately blank
- [ ] Every news release URL resolves
- [ ] Transaction releases added to `news.json`
- [ ] Every management and board title matches the latest filing
- [ ] Every financial figure matches its release word for word
- [ ] The deck PDF is the approved version and `DECK_VERSION` matches it
- [ ] `TRADING_LIVE` reflects reality
- [ ] `MIN_COHORT` matches what the product actually enforces
- [ ] The three proof points (17K / 25% / 365) have a source, a date, and sign-off — **or they come off the site.** None of them appears in any release currently in `news.json`.
- [ ] No metric comparison that puts a weekly rate next to an annual one

**Approval**
- [ ] Everything ships marked `[DRAFT — PENDING SIGN-OFF]`. A named executive (CEO, COO, or CTO) promotes lines to `[APPROVED]` in writing — this is a standing Everkind brand guardrail, not a formality.
- [ ] Legal review of the forward-looking statement and the not-an-offer language for your jurisdiction
- [ ] **Sponsor / exchange review of the IR pages.** The site publishes operating metrics and marketing claims about the target while an RTO is pending and a financing has just closed. Standing rule from here on: nothing appears on this site that isn't already in a filed release.

**Scan**
- [ ] Search the built site, case-insensitive, for: `therapy`, `therapeutic`, `treatment`, `clinical care`, `diagnos`, `patient`, `mental-health provider`, `guarantee`, `proven`, `will reduce`, `act now`, `limited`, `don't miss`, `hurry`, `spots`, `invest now`, `buy shares`. Any hit outside a "we are not this" disclaimer is a problem.
