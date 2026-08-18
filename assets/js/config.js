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
  // TradingView symbol format is EXCHANGE:TICKER. Note: TradingView's
  // TSXV symbols carry no '.V' suffix - Everkind will be 'TSXV:EK'.
  // As of 2026-08-18 TradingView does not carry the symbol yet (its
  // TSXV feed still lists the shell as TSXV:AF.P), so TRADING_LIVE
  // stays false. Flip it the day 'TSXV:EK' resolves on tradingview.com.
  TRADINGVIEW_SYMBOL: 'TSXV:AF.P',      // the CPC vehicle - swap to 'TSXV:EK' on listing day
  EXCHANGE_LABEL:     'TSX Venture Exchange',
  TICKER_LABEL:       'EK.V',            // Everkind's expected ticker, per the company

  // Shown as a notice above the chart. REQUIRED while the chart shows
  // the CPC vehicle rather than Everkind's own shares - presenting
  // AF.P as "Everkind stock" without this would be misleading.
  CHART_CONTEXT: "This chart shows AF2 Capital Corp. (TSXV: AF.P), the capital pool company through which Everkind's going-public transaction is being completed. It is not a quotation for Everkind shares. Everkind's common shares are expected to begin trading under TSXV: EK.V, and this chart will be replaced when trading commences.",

  // MASTER SWITCH. false => the market-data module renders a designed
  // "chart coming soon" card instead of a chart. Only true once
  // TradingView actually resolves TRADINGVIEW_SYMBOL - otherwise the
  // embed renders "This symbol doesn't exist".
  TRADING_LIVE: true,

  /* ── Pipedrive ──────────────────────────────────────────── */
  // Pipedrive > Leads > Web forms > Share > Embed. Public URL only:
  // https://webforms.pipedrive.com/f/XXXXXXXXXXXXXXXXXXXX
  PIPEDRIVE_FORM_URL: '{{PIPEDRIVE_FORM_URL}}',

  /* ── Calendly ───────────────────────────────────────────── */
  // Full event URL, e.g. https://calendly.com/everkind-ir/30min
  // NOTE: background_color / text_color / primary_color are ignored
  // on Calendly's free tier. On free, the embed renders light -
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
  // to an organization. Referenced in copy - see SETUP_CHECKLIST §6.
  MIN_COHORT: '{{MIN_COHORT}}',              // e.g. 25

  /* ── App store & social ─────────────────────────────────── */
  APP_STORE_URL:  'https://apps.apple.com/ca/app/everkind-wellness-journal-app/id6748688830',
  PLAY_STORE_URL: '{{PLAY_STORE_URL}}',
  LINKEDIN_URL:   'https://www.linkedin.com/company/everkindinc/',
  INSTAGRAM_URL:  'https://www.instagram.com/everkind/',
  TWITTER_URL:    'https://x.com/everkindinc',

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
} catch (_) { /* private mode - ignore */ }

/* Every consumer calls this before rendering an embed or a link. */
export const isSet = (v) =>
  typeof v === 'string' && v.length > 0 && !v.startsWith('{{');
