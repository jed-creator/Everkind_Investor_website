/* utils.js
 * ─────────────────────────────────────────────────────────────
 * Shared helpers. Exports: isSet (re-export), prefersReducedMotion,
 * clamp, lerp, debounce, throttle, onWidthResize, once, el,
 * setupCard, hexSVG, formatDate, escapeHTML.
 *
 * TUNE:
 *   RESIZE_DEBOUNCE_MS  — width-resize debounce (default 220)
 * ───────────────────────────────────────────────────────────── */
export { isSet } from './config.js';

const RESIZE_DEBOUNCE_MS = 220;

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;

export const debounce = (fn, ms = RESIZE_DEBOUNCE_MS) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
};

export const throttle = (fn, ms = 32) => {
  let last = 0, timer = null;
  return (...args) => {
    const now = performance.now();
    if (now - last >= ms) { last = now; fn(...args); }
    else if (!timer) {
      timer = setTimeout(() => { timer = null; last = performance.now(); fn(...args); }, ms - (now - last));
    }
  };
};

/* Width-ONLY debounced resize — mobile URL-bar height thrash must
   not retrigger split-text or ScrollTrigger work (§6.3). */
export const onWidthResize = (fn) => {
  let lastW = window.innerWidth;
  window.addEventListener('resize', debounce(() => {
    if (window.innerWidth !== lastW) { lastW = window.innerWidth; fn(); }
  }));
};

export const once = (fn) => {
  let done = false;
  return (...args) => { if (!done) { done = true; return fn(...args); } };
};

/* Tiny element builder: el('div', {class:'x', text:'y'}, [children]) */
export const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else node.setAttribute(k, v);
  }
  for (const c of children) node.append(c);
  return node;
};

export const escapeHTML = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

/* The soft-hexagon mark path used at five scales (§7.1):
   favicon, loading indicator, news bullet, deck dots, avatars. */
export const HEX_PATH =
  'M50 4 L88 25 Q94 28 94 35 L94 73 Q94 80 88 83 L50 104 L12 83 Q6 80 6 73 L6 35 Q6 28 12 25 Z';

export const hexSVG = (cls = '', gradientId = 'ek-hex-grad') => `
  <svg class="${cls}" viewBox="0 0 100 108" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#5E1AA3"/>
        <stop offset="1" stop-color="#A96BAD"/>
      </linearGradient>
    </defs>
    <path d="${HEX_PATH}" fill="url(#${gradientId})"/>
  </svg>`;

/* Setup card (§11.1) — rendered wherever a CONFIG value is unset. */
export const setupCard = (field, minHeight = null) => {
  const card = el('div', { class: 'setup-card', role: 'note' });
  if (minHeight) card.style.minHeight = minHeight;
  card.append(
    el('span', { class: 'setup-card__badge', text: 'Setup required' }),
    el('p', { class: 'setup-card__field', text: field }),
    el('p', { class: 'setup-card__help', text: 'Add this value in assets/js/config.js. See SETUP_CHECKLIST.md.' })
  );
  return card;
};

export const formatDate = (iso) => {
  if (!iso || iso.startsWith('{{')) return null;
  const d = new Date(iso + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
};

/* Inject a third-party script correctly — createElement, never
   innerHTML (an innerHTML <script> will not execute). */
export const injectScript = (src, { onload, onerror, textContent } = {}) => {
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  if (textContent) s.textContent = textContent;
  if (onload) s.onload = onload;
  if (onerror) s.onerror = onerror;
  document.head.appendChild(s);
  return s;
};

/* IntersectionObserver helper for lazy embeds — 400px rootMargin (§3). */
export const onIntersect = (target, cb, rootMargin = '400px') => {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { io.disconnect(); cb(); break; }
    }
  }, { rootMargin });
  io.observe(target);
  return io;
};
