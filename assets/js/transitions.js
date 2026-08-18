/* transitions.js
 * ─────────────────────────────────────────────────────────────
 * Page transitions (§6.6). Two mutually exclusive mechanisms:
 *   1. Cross-document View Transitions — pure CSS
 *      (`@view-transition { navigation: auto }` lives in tokens.css
 *      in every document). If the browser supports it, this module
 *      does nothing except the first-visit intro.
 *   2. The curtain — click-intercepted SVG sweep for browsers
 *      without cross-document view transitions.
 *
 * Exports: initTransitions()
 *
 * TUNE:
 *   CURTAIN_UP_MS    620  — cover sweep
 *   CURTAIN_DOWN_MS  720  — reveal sweep on the next page
 *   FAILSAFE_MS      1200 — unconditional curtain removal
 * ───────────────────────────────────────────────────────────── */
import { prefersReducedMotion } from './utils.js';
import { bloom } from './background.js';

const CURTAIN_UP_MS = 620;
const CURTAIN_DOWN_MS = 720;
const FAILSAFE_MS = 1200;

const supportsCrossDocVT = () =>
  'CSSViewTransitionRule' in window ||
  (window.matchMedia && CSS.supports('view-transition-name: x') && 'onpagereveal' in window);

/* The curtain: full-screen ink panel whose top edge is a curved
   SVG path — the curve is the whole trick. */
function buildCurtain() {
  const wrap = document.createElement('div');
  wrap.className = 'curtain';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = `
    <svg viewBox="0 0 100 110" preserveAspectRatio="none">
      <defs>
        <linearGradient id="curtain-edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#F2C6DC" stop-opacity=".55"/>
          <stop offset=".12" stop-color="#0C0710"/>
          <stop offset="1" stop-color="#0C0710"/>
        </linearGradient>
      </defs>
      <path class="curtain-path" d="M0,10 Q50,0 100,10 L100,110 L0,110 Z" fill="url(#curtain-edge)"/>
    </svg>`;
  document.body.appendChild(wrap);
  return wrap;
}

function shouldIntercept(a, e) {
  if (e.defaultPrevented) return false;
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (a.target === '_blank' || a.rel.includes('external') || a.hasAttribute('download')) return false;
  const href = a.getAttribute('href');
  if (!href) return false;
  let url;
  try { url = new URL(a.href, location.href); } catch (_) { return false; }
  if (!/^https?:$/.test(url.protocol)) return false;            // mailto:, tel:
  if (url.origin !== location.origin) return false;
  // Same page, hash-only difference → let the browser (or Lenis) handle it.
  if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
  return true;
}

function runIntro() {
  const intro = document.getElementById('intro');
  if (!intro) return;
  let seen = false;
  try { seen = sessionStorage.getItem('ek-intro') === '1'; } catch (_) {}
  if (seen || prefersReducedMotion()) { intro.remove(); return; }
  try { sessionStorage.setItem('ek-intro', '1'); } catch (_) {}

  // Measure stroke lengths for the draw-in.
  intro.querySelectorAll('.draw-path').forEach((p) => {
    try { p.style.setProperty('--path-len', String(Math.ceil(p.getTotalLength()) + 2)); } catch (_) {}
  });

  const finish = () => {
    intro.style.transition = 'opacity .5s linear';
    intro.style.opacity = '0';
    setTimeout(() => intro.remove(), 520);
    window.removeEventListener('keydown', finish);
    window.removeEventListener('pointerdown', finish);
  };
  // Any keypress or click skips it.
  window.addEventListener('keydown', finish, { once: true });
  window.addEventListener('pointerdown', finish, { once: true });
  setTimeout(finish, 1600);
  bloom(1);
}

export function initTransitions() {
  runIntro();

  /* FAILSAFE 1 (unconditional): whatever state the curtain flag is
     in, the covering class is removed after FAILSAFE_MS. Anyone
     arriving cold from a search result must never sit behind ink. */
  setTimeout(() => document.documentElement.classList.remove('curtain-covering'), FAILSAFE_MS);

  /* FAILSAFE 2: Back/forward from bfcache restores frozen mid-
     animation — clear the curtain on pageshow. */
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      document.documentElement.classList.remove('curtain-covering');
      document.querySelector('.curtain')?.remove();
    }
  });

  if (supportsCrossDocVT() || prefersReducedMotion()) return; // CSS handles it — or nothing does

  /* ── Curtain fallback path ── */
  const curtain = buildCurtain();
  const path = curtain.querySelector('.curtain-path');

  // Arriving with the flag set (inline <head> script added the class):
  // sweep the curtain away, overlapping the hero reveal.
  if (document.documentElement.classList.contains('curtain-covering')) {
    curtain.style.transform = 'translateY(0)';
    requestAnimationFrame(() => {
      curtain.style.transition = `transform ${CURTAIN_DOWN_MS}ms cubic-bezier(.65,0,.35,1)`;
      curtain.style.transform = 'translateY(-102%)';
      setTimeout(() => {
        document.documentElement.classList.remove('curtain-covering');
        curtain.style.transition = '';
        curtain.style.transform = '';
      }, CURTAIN_DOWN_MS + 40);
    });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || !shouldIntercept(a, e)) return;
    e.preventDefault();
    bloom(1);

    // Sweep up with a curved leading edge (the control point animates).
    curtain.style.transition = `transform ${CURTAIN_UP_MS}ms cubic-bezier(.65,0,.35,1)`;
    curtain.style.transform = 'translateY(0)';
    if (window.gsap) {
      const proxy = { q: 0 };
      gsap.to(proxy, {
        q: 14, duration: CURTAIN_UP_MS / 1000, ease: 'power2.out',
        onUpdate: () => path.setAttribute('d', `M0,10 Q50,${10 - proxy.q} 100,10 L100,110 L0,110 Z`),
      });
    }
    setTimeout(() => {
      try { sessionStorage.setItem('ek-curtain', '1'); } catch (_) {}
      location.href = a.href;
    }, CURTAIN_UP_MS);
  });
}
