/* assets/js/config.js
 * ─────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH. Everything the client swaps lives here
 * and nowhere else. See SETUP_CHECKLIST.md.
 * ───────────────────────────────────────────────────────────── */
export const CONFIG = {

  /* ── Site ───────────────────────────────────────────────── */
  SITE_URL:    '{{SITE_URL}}',      // required for canonicals, OG, sitemap
  PRIVACY_URL: '{{PRIVACY_URL}}',
  TERMS_URL:   '{{TERMS_URL}}',
  SUPPORT_URL: '{{SUPPORT_URL}}',
  ACCESSIBILITY_URL: '{{ACCESSIBILITY_URL}}',

  /* ── Market data ────────────────────────────────────────── */
  // TradingView symbol format is EXCHANGE:TICKER.
  TRADINGVIEW_SYMBOL: 'TSXV:EK.V',      // per the company, 2026-08-18
  EXCHANGE_LABEL:     'TSX Venture Exchange',
  TICKER_LABEL:       'EK.V',

  // MASTER SWITCH. false => the market-data module renders a
  // "Listing pending" card instead of a chart. Only true while the
  // resulting issuer is actually trading under its own symbol.
  TRADING_LIVE: true,

  /* ── Pipedrive ──────────────────────────────────────────── */
  // Pipedrive > Leads > Web forms > Share > Embed. Public URL only:
  // https://webforms.pipedrive.com/f/XXXXXXXXXXXXXXXXXXXX
  PIPEDRIVE_FORM_URL: '{{PIPEDRIVE_FORM_URL}}',

  /* ── Calendly ───────────────────────────────────────────── */
  // Full event URL, e.g. https://calendly.com/everkind-ir/30min
  // NOTE: background_color / text_color / primary_color are ignored
  // on Calendly's free tier. On free, the embed renders light —
  // design the surrounding card so that still looks deliberate.
  CALENDLY_URL: '{{CALENDLY_URL}}',

  /* ── Contact ────────────────────────────────────────────── */
  IR_EMAIL:      'investors@everkind.com',   // {{VERIFY it resolves}}
  GENERAL_EMAIL: '{{GENERAL_EMAIL}}',
  MEDIA_EMAIL:   '{{MEDIA_EMAIL}}',
  IR_PHONE:      '{{IR_PHONE}}',             // optional; omit block if blank
  HQ_ADDRESS:    '{{HQ_ADDRESS}}',           // optional

  /* ── Deck ───────────────────────────────────────────────── */
  DECK_PDF:      'assets/docs/everkind-investor-deck.pdf',
  DECK_MANIFEST: 'assets/data/deck.json',
  DECK_VERSION:  'June 2026',

  /* ── Data feeds ─────────────────────────────────────────── */
  NEWS_JSON: 'assets/data/news.json',
  TEAM_JSON: 'assets/data/team.json',

  /* ── Privacy reporting threshold ────────────────────────── */
  // Minimum enrolled headcount before aggregate reporting is shown
  // to an organization. Referenced in copy — see SETUP_CHECKLIST §6.
  MIN_COHORT: '{{MIN_COHORT}}',              // e.g. 25

  /* ── App store & social ─────────────────────────────────── */
  APP_STORE_URL:  '{{APP_STORE_URL}}',
  PLAY_STORE_URL: '{{PLAY_STORE_URL}}',
  LINKEDIN_URL:   '{{LINKEDIN_URL}}',

  /* ── Motion ─────────────────────────────────────────────── */
  MOTION: {
    intensity: 1.0,           // master dial 0–1
    forceCssBackground: false // true => never load WebGL
  },
};

/* Merge the user's persisted motion preference BEFORE anything
   reads CONFIG.MOTION. background.js must never decide first. */
try {
  const saved = localStorage.getItem('ek-motion');
  if (saved === 'reduced') {
    CONFIG.MOTION.intensity = 0;
    CONFIG.MOTION.forceCssBackground = true;
  }
} catch (_) { /* private mode — ignore */ }

/* Every consumer calls this before rendering an embed or a link. */
export const isSet = (v) =>
  typeof v === 'string' && v.length > 0 && !v.startsWith('{{');
