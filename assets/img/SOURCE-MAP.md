# Asset source map

Every asset rename, in one place. **All placeholders are gone** — as of
2026-08-18 the site uses the client's real assets from the two supplied
folders: `01_Everkind Logo Assets 2` and `Product Assets 2`.

## Logo (`assets/logo/`)

| Original (client pack) | New filename | Used for |
|---|---|---|
| `PNG/everkind_logo_preferred_lockup_RGB_colour_2000px.png` (2546×1309) | `everkind-lockup.png` | **Primary.** Header on every page, footer, OG image source, JSON-LD logo |
| crop of the lockup's hexagon mark (535×535) | `everkind-mark.png` | Intro overlay, favicon source |
| `SVG/everkind_stacked_logo_preferred_lockup_colour.svg` | `everkind-logo.svg` | Stacked lockup (kept for future use) |
| `SVG/everkind_stacked_reverse_logo_preferred_lockup_colour.svg` | `everkind-logo-reverse.svg` | Reverse lockup (kept for future dark surfaces) |
| `PNG/everkind Logo Pack – 04-30-2026/white_light hex.png` | `everkind-logo-white.png` | Raster fallback (kept) |
| `PNG/take-your-moment-tag-500px.png` (500×90) | `everkind-tag.png` | "Take your moment." lockup — footer + Home closing |
| mark resized to 180×180 | `/favicon-180.png` | Favicon + Apple touch icon |
| lockup on #FBF7FB, 1200×630 | `assets/img/og-default.png` | Open Graph / Twitter card |

## Product renders (`assets/img/product/`)

All ten are the client's real renders (1080×1350 transparent PNGs).

| Original | New filename | Shows | Placement |
|---|---|---|---|
| `Copy of 1.png` | `ek-home-and-player.png` | App home ("Hey there! How are you doing right now?", Personalized meditations Peace/Calm) + Intentional Breathing player | **Home hero** |
| `Copy of 8.png` | `ek-journal-reflection.png` | Journal conversation (written entry + reflective response) | Home "How it works" beat 1; Product AI Journal — **always with the "Illustrative…" caption** |
| `Copy of 2.png` | `ek-journal-and-rest.png` | Journal chat + Drift Into Rest player | Product intro |
| `Copy of 4.png` | `ek-meditation-library.png` | Guest guided meditation + personalized meditations | Product AI Meditation pillar |
| `Copy of 7.png` | `ek-player-breathing.png` | Intentional Breathing player, straight-on | Home beat 3 |
| `Copy of 3.png` | `ek-player-breathing-angled.png` | Same screen, angled | Product hero |
| `Copy of 6.png` | `ek-player-rest.png` | Drift Into Rest player, straight-on | Home beat 2; Product guest meditations |
| `Copy of 9.png` | `ek-journal-lock.png` | Lock your journal | Home privacy section |
| `Copy of 5.png` | `ek-journal-lock-angled.png` | Same screen, angled | (available; not currently placed) |
| `Copy of 10.png` | `ek-journal-protected.png` | PIN confirm + "journal is now protected" | Product privacy section |

## Deck (`assets/img/deck/`)

`deck-01.jpg … deck-24.jpg` — the pages of
`assets/docs/everkind-investor-deck.pdf` ('everkind Deck June 2026'),
rendered at 1800px via pdftoppm. Shown 1:1 in the Investors deck widget.

## Notes

- **Voice Mode still has no supplied capture** — the Product page keeps the
  abstract brand-gradient waveform on purpose. Do not substitute a
  screenshot of another feature.
- Headshots for team cards are still not supplied; branded initials
  avatars render in their place (add `photo` paths in team.json anytime).
- If a logo or render is ever replaced, keep the filenames above and the
  site updates everywhere at once.
