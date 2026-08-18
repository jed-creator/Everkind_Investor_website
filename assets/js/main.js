/* main.js
 * ─────────────────────────────────────────────────────────────
 * Entry point, page-aware. Order matters:
 *   1. config-driven links/text (setup cards where unset)
 *   2. smooth scroll + nav + transitions (the chrome)
 *   3. reveals / magnetic / morph / counters (the motion system)
 *   4. data renderers (deck, news, team)
 *   5. third-party widgets (lazy, intersection-driven)
 *   6. background shader (dynamic import, after first paint)
 *
 * TUNE:
 *   Nothing here — every dial lives in the module it belongs to.
 * ───────────────────────────────────────────────────────────── */
import { CONFIG, isSet } from './config.js';
import { el, setupCard } from './utils.js';
import { initSmoothScroll } from './lenis-gsap.js';
import { initNav } from './nav.js';
import { initTransitions } from './transitions.js';
import { initReveals } from './reveals.js';
import { initMagnetic } from './magnetic.js';
import { initMorph } from './morph.js';
import { initCounters } from './counters.js';
import { initDeck } from './deck.js';
import { initNews } from './news.js';
import { initTeam } from './team.js';
import { initWidgets } from './widgets.js';
import { initBackground } from './background.js';

/* ── Config-driven links, emails and text ────────────────────
 * <a data-config-link="PRIVACY_URL">…</a>  — href from CONFIG;
 *   unset → the link is replaced by a small setup note (never "#").
 * <a data-config-email="IR_EMAIL">        — mailto:
 * <span data-config-text="MIN_COHORT">    — text swap; unset keeps
 *   the visible {{PLACEHOLDER}} so gaps are impossible to miss.
 * <div data-config-block="IR_PHONE">      — removed when unset.   */
function applyConfig() {
  document.querySelectorAll('[data-config-link]').forEach((a) => {
    const key = a.dataset.configLink;
    if (isSet(CONFIG[key])) {
      a.href = CONFIG[key];
      if (/^https?:/.test(CONFIG[key]) ) { a.rel = 'noopener'; }
    } else {
      const note = el('span', { class: 'footer-setup-note', text: `${a.textContent.trim()} — setup required (${key})` });
      a.replaceWith(note);
    }
  });

  document.querySelectorAll('[data-config-email]').forEach((a) => {
    const key = a.dataset.configEmail;
    if (isSet(CONFIG[key])) {
      a.href = `mailto:${CONFIG[key]}`;
      if (!a.textContent.trim() || a.hasAttribute('data-config-email-text')) a.textContent = CONFIG[key];
    } else {
      a.replaceWith(el('span', { class: 'footer-setup-note', text: `Setup required (${key})` }));
    }
  });

  document.querySelectorAll('[data-config-text]').forEach((node) => {
    const key = node.dataset.configText;
    if (isSet(CONFIG[key])) node.textContent = CONFIG[key];
    /* unset → the {{PLACEHOLDER}} in the markup stays visible */
  });

  document.querySelectorAll('[data-config-block]').forEach((node) => {
    const key = node.dataset.configBlock;
    if (!isSet(CONFIG[key])) node.remove();   // optional blocks vanish cleanly
  });

  document.querySelectorAll('[data-config-setup-card]').forEach((node) => {
    const key = node.dataset.configSetupCard;
    if (!isSet(CONFIG[key])) node.replaceWith(setupCard(key, node.dataset.setupHeight || null));
  });
}

/* ── Canonical + absolute OG URLs, derived from SITE_URL (§11.4).
 * With no build step these are injected at runtime once SITE_URL
 * is configured; until then pages simply carry no canonical. */
function seoLinks() {
  if (!isSet(CONFIG.SITE_URL)) return;
  const base = CONFIG.SITE_URL.replace(/\/$/, '');
  const page = location.pathname.split('/').pop() || 'index.html';
  const canonical = el('link', { rel: 'canonical', href: `${base}/${page === 'index.html' ? '' : page}` });
  document.head.append(canonical);
  const og = document.querySelector('meta[property="og:image"]');
  if (og) og.setAttribute('content', `${base}/assets/img/og-default.png`);
  const ogUrl = el('meta', { property: 'og:url', content: canonical.href });
  document.head.append(ogUrl);
}

/* ── Corporate information table — ONE shared partial rendered on
 * both Company and Investors so the two can never drift (§10.3).
 * Never invent a number: unknowns stay visible {{}} placeholders. */
function corpInfo() {
  const mounts = document.querySelectorAll('[data-corp-info]');
  if (!mounts.length) return;
  const rows = [
    ['Legal name', '<span class="ph">{{LEGAL_NAME — resulting issuer name is filing-specific}}</span>'],
    ['Exchange', CONFIG.EXCHANGE_LABEL],
    ['Ticker', `${CONFIG.TICKER_LABEL} <span class="ph">{{VERIFY}}</span>`],
    ['Transfer agent', '<span class="ph">{{TRANSFER_AGENT}}</span>'],
    ['Auditor', '<span class="ph">{{AUDITOR}}</span>'],
    ['Fiscal year end', '<span class="ph">{{FISCAL_YEAR_END}}</span>'],
    ['Shares outstanding', '<span class="ph">{{SHARES_OUTSTANDING — as of {{DATE}}, per the referenced release}}</span>'],
  ];
  mounts.forEach((m) => {
    m.innerHTML = `<div class="overflow-guard"><table class="info-table">
      <caption class="visually-hidden">Corporate information</caption>
      <tbody>${rows.map(([k, v]) => `<tr><th scope="row">${k}</th><td>${v}</td></tr>`).join('')}</tbody>
    </table></div>
    <p class="notice" style="margin-top:1rem">Every value in this table must be quoted from a dated
    public release or filing and verified before launch. Placeholders are shown deliberately —
    nothing on this site is invented.</p>`;
  });
}

/* ── Footer reduced-motion toggle (§6.8): persist + reload —
 * the only reliable version. */
function motionToggle() {
  const btn = document.querySelector('[data-motion-toggle]');
  if (!btn) return;
  let reduced = false;
  try { reduced = localStorage.getItem('ek-motion') === 'reduced'; } catch (_) {}
  btn.setAttribute('aria-pressed', String(reduced));
  btn.querySelector('.motion-toggle__label').textContent =
    reduced ? 'Motion: reduced' : 'Motion: full';
  btn.addEventListener('click', () => {
    try {
      if (reduced) localStorage.removeItem('ek-motion');
      else localStorage.setItem('ek-motion', 'reduced');
    } catch (_) {}
    location.reload();
  });
}

/* ── Boot ─────────────────────────────────────────────────── */
document.documentElement.classList.add('js');

applyConfig();
seoLinks();
corpInfo();
motionToggle();
initNav();
initSmoothScroll();
initTransitions();
initReveals();
initMagnetic();
initMorph();
initCounters();

initDeck();
initNews();
initTeam();
initWidgets();

/* Background: after first paint, so the CSS aurora always wins
   the race and WebGL crossfades in when ready (§5.6). */
requestAnimationFrame(() => { initBackground(); });
