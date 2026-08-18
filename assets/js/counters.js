/* counters.js
 * ─────────────────────────────────────────────────────────────
 * Number count-up for the proof strip. Usage:
 *   <span data-counter data-counter-to="17" data-counter-suffix="K">17K</span>
 * The final value lives in the markup, so no-JS and reduced-motion
 * users simply see it (§6.8: counters render final values immediately).
 *
 * Exports: initCounters()
 *
 * TUNE:
 *   DURATION 1.6 — seconds for the count
 * ───────────────────────────────────────────────────────────── */
import { prefersReducedMotion } from './utils.js';

const DURATION = 1.6;

export function initCounters() {
  const nodes = document.querySelectorAll('[data-counter]');
  if (!nodes.length) return;
  if (prefersReducedMotion() || !window.gsap || !window.ScrollTrigger) return; // markup already shows finals

  nodes.forEach((node) => {
    const to = parseFloat(node.dataset.counterTo);
    if (Number.isNaN(to)) return;
    const suffix = node.dataset.counterSuffix || '';
    const decimals = (String(node.dataset.counterTo).split('.')[1] || '').length;
    const proxy = { v: 0 };
    gsap.to(proxy, {
      v: to, duration: DURATION, ease: 'power2.out',
      scrollTrigger: { trigger: node, start: 'top 85%', once: true },
      onUpdate: () => { node.textContent = proxy.v.toFixed(decimals) + suffix; },
      onComplete: () => { node.textContent = to.toFixed(decimals) + suffix; },
    });
  });
}
