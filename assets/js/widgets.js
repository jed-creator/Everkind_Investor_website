/* widgets.js
 * ─────────────────────────────────────────────────────────────
 * Third-party embed loaders: TradingView, Pipedrive, Calendly.
 * Everything injects on IntersectionObserver at 400px rootMargin,
 * via document.createElement('script') — never innerHTML.
 * Every widget handles the unset-config case with a setup card
 * (§11.1) and every load failure with a graceful fallback.
 *
 * Exports: initWidgets()
 *
 * TUNE:
 *   TV_TIMEOUT_MS  6000 — TradingView iframe poll budget (§8.3)
 *   PD_TIMEOUT_MS  8000 — Pipedrive form budget (§8.5)
 * ───────────────────────────────────────────────────────────── */
import { CONFIG, isSet } from './config.js';
import { el, setupCard, injectScript, onIntersect, hexSVG } from './utils.js';

const TV_TIMEOUT_MS = 6000;
const PD_TIMEOUT_MS = 8000;

const cssVar = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function skeleton(shell) {
  const sk = el('div', { class: 'embed-skeleton', 'aria-hidden': 'true', html: hexSVG('', `sk-grad-${Math.random().toString(36).slice(2, 8)}`) });
  shell.classList.add('embed-shell');
  shell.prepend(sk);
  return () => shell.classList.add('is-loaded');
}

/* ── TradingView (§8.3) ─────────────────────────────────────── */
function initTradingView() {
  const mount = document.querySelector('[data-widget="tradingview"]');
  if (!mount) return;

  if (!CONFIG.TRADING_LIVE) {
    /* "Listing pending" card — the correct default, designed not broken. */
    mount.innerHTML = `
      <div class="listing-pending">
        <p class="eyebrow">Market information</p>
        <h3>Listing pending</h3>
        <dl class="listing-pending__row">
          <div><dt>Exchange</dt><dd>${CONFIG.EXCHANGE_LABEL}</dd></div>
          <div><dt>Proposed ticker</dt><dd>${CONFIG.TICKER_LABEL} <span class="ph">{{VERIFY}}</span></dd></div>
        </dl>
        <p class="muted">Trading has not commenced under the resulting issuer's own symbol.
        The proposed transaction with AF2 Capital Corp. remains subject to exchange approval
        and customary conditions. A live chart will appear here on the first day of trading.</p>
        <p style="margin-top:1rem"><a class="link-arrow" href="news.html#transaction">Read the transaction releases <span class="arr" aria-hidden="true">→</span></a></p>
      </div>`;
    return;
  }

  if (!isSet(CONFIG.TRADINGVIEW_SYMBOL)) {
    mount.replaceChildren(setupCard('TRADINGVIEW_SYMBOL', '480px'));
    return;
  }

  onIntersect(mount, () => {
    mount.innerHTML = `
      <!-- Advanced Real-Time Chart. Container needs explicit height —
           "autosize" fills the parent, and a parent with no height
           collapses to zero. No transformed/filtered/pinned ancestor. -->
      <div class="tradingview-widget-container" id="tv-advanced"
           style="min-height:480px; aspect-ratio:16/10;">
        <div class="tradingview-widget-container__widget"></div>
        <div class="tradingview-widget-copyright">
          <!-- TradingView attribution is required by their terms. Do not remove. -->
          <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
            <span class="blue-text">Track all markets on TradingView</span>
          </a>
        </div>
      </div>`;
    const container = mount.querySelector('.tradingview-widget-container__widget');
    const s = document.createElement('script');
    s.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    s.async = true;
    s.textContent = JSON.stringify({
      symbol: CONFIG.TRADINGVIEW_SYMBOL,
      theme: 'light',
      autosize: true,
      interval: 'D',
      timezone: 'America/Toronto',
      style: '3',                       // area — calmer than candles
      locale: 'en',
      backgroundColor: cssVar('--ek-ink-2'),
      gridColor: cssVar('--ek-ink-3'),
      hide_side_toolbar: true,
      allow_symbol_change: false,
      save_image: false,
      withdateranges: true,
    });
    container.appendChild(s);

    /* The script swallows its own errors — poll for the iframe (§8.3). */
    const deadline = performance.now() + TV_TIMEOUT_MS;
    (function poll() {
      if (mount.querySelector('iframe')) return;
      if (performance.now() > deadline) {
        mount.innerHTML = '';
        const card = el('div', { class: 'listing-pending' });
        card.innerHTML = `
          <h3>Chart temporarily unavailable</h3>
          <p class="muted">Market data could not be loaded right now. You can view the
          quote for ${CONFIG.TICKER_LABEL} directly on the exchange.</p>
          <p style="margin-top:1rem"><a class="link-arrow" href="https://www.tsx.com/en/listings/listing-with-us/tsx-venture-exchange" target="_blank" rel="noopener">Open the exchange's quote page <span class="arr" aria-hidden="true">→</span></a></p>`;
        mount.append(card);
        return;
      }
      setTimeout(poll, 300);
    })();
  });
}

/* ── Pipedrive (§8.5) ───────────────────────────────────────── */
let pipedriveLoaderInjected = false;
function initPipedrive() {
  const mounts = document.querySelectorAll('[data-widget="pipedrive"]');
  if (!mounts.length) return;

  if (!isSet(CONFIG.PIPEDRIVE_FORM_URL)) {
    mounts.forEach((m) => m.replaceChildren(setupCard('PIPEDRIVE_FORM_URL', '620px')));
    return;
  }

  mounts.forEach((mount) => {
    onIntersect(mount, () => {
      const done = skeleton(mount);
      const holder = el('div', { class: 'pipedriveWebForms' });
      holder.setAttribute('data-pd-webforms', CONFIG.PIPEDRIVE_FORM_URL);
      mount.append(holder);

      if (!pipedriveLoaderInjected) {
        pipedriveLoaderInjected = true;
        injectScript('https://webforms.pipedrive.com/f/loader');
      }

      /* 8s budget; on failure swap in mailto so the lead is never lost. */
      const deadline = performance.now() + PD_TIMEOUT_MS;
      (function poll() {
        if (mount.querySelector('iframe')) { done(); return; }
        if (performance.now() > deadline) {
          mount.classList.add('is-loaded');
          holder.replaceChildren(el('div', { class: 'notice', html:
            `The form couldn't load. Email us instead at <a href="mailto:${CONFIG.IR_EMAIL}">${CONFIG.IR_EMAIL}</a> and we'll add you to the investor list.` }));
          return;
        }
        setTimeout(poll, 400);
      })();
    });
  });
}

/* ── Calendly (§8.6) ────────────────────────────────────────── */
let calendlyAssetsInjected = false;
function calendlyUrl() {
  /* new URL() + searchParams — string concat breaks if the event
     URL already carries a query string. */
  const url = new URL(CONFIG.CALENDLY_URL);
  url.searchParams.set('background_color', cssVar('--ek-ink-2').replace('#', ''));
  url.searchParams.set('text_color', cssVar('--ek-text').replace('#', ''));
  url.searchParams.set('primary_color', cssVar('--ek-orchid').replace('#', ''));
  /* Deliberately NOT setting hide_gdpr_banner (§8.6). */
  return url.toString();
}

function injectCalendlyAssets(cb) {
  if (calendlyAssetsInjected) { cb && cb(); return; }
  calendlyAssetsInjected = true;
  /* BOTH widget.js and widget.css — without the stylesheet the
     inline widget renders unstyled and the popup has no overlay. */
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://assets.calendly.com/assets/external/widget.css';
  document.head.appendChild(link);
  injectScript('https://assets.calendly.com/assets/external/widget.js', { onload: cb });
}

function initCalendly() {
  const inlines = document.querySelectorAll('[data-widget="calendly-inline"]');
  const buttons = document.querySelectorAll('[data-widget="calendly-popup"]');
  if (!inlines.length && !buttons.length) return;

  if (!isSet(CONFIG.CALENDLY_URL)) {
    inlines.forEach((m) => m.replaceChildren(setupCard('CALENDLY_URL', '400px')));
    buttons.forEach((b) => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        const existing = b.parentElement.querySelector('.setup-card');
        if (!existing) b.insertAdjacentElement('afterend', setupCard('CALENDLY_URL'));
      });
    });
    return;
  }

  inlines.forEach((mount) => {
    onIntersect(mount, () => {
      const done = skeleton(mount);
      const holder = el('div', { class: 'calendly-inline-widget', 'data-url': calendlyUrl() });
      holder.style.minWidth = '320px';
      holder.style.height = '700px';
      mount.append(holder);
      injectCalendlyAssets(() => {
        if (window.Calendly) {
          window.Calendly.initInlineWidget({ url: calendlyUrl(), parentElement: holder });
        }
        setTimeout(done, 600);
      });
    });
  });

  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      injectCalendlyAssets(() => {
        if (window.Calendly) window.Calendly.initPopupWidget({ url: calendlyUrl() });
      });
    });
  });
}

export function initWidgets() {
  initTradingView();
  initPipedrive();
  initCalendly();
}
