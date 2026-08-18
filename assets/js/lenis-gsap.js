/* lenis-gsap.js
 * ─────────────────────────────────────────────────────────────
 * Momentum smooth scroll (Lenis) driven by GSAP's ticker, wired
 * to ScrollTrigger. Exports: initSmoothScroll() → lenis|null.
 *
 * Lenis is configured with LERP ONLY - no duration/easing. Lenis
 * branches `if (duration && easing) … else if (lerp) …`, so
 * passing all three silently ignores the lerp (§6.2).
 *
 * TUNE:
 *   LERP             0.07   - lower = heavier, more momentum
 *   WHEEL_MULTIPLIER 0.95
 *   TOUCH_MULTIPLIER 1.6
 * ───────────────────────────────────────────────────────────── */
import { prefersReducedMotion } from './utils.js';

const LERP = 0.07;               // lower = longer, more fluid glide
const WHEEL_MULTIPLIER = 1.0;
const TOUCH_MULTIPLIER = 1.6;

export let lenis = null;

export function initSmoothScroll() {
  if (prefersReducedMotion()) return null;           // §6.8: no Lenis
  if (typeof Lenis === 'undefined' || typeof gsap === 'undefined') return null;

  lenis = new Lenis({
    lerp: LERP,                    // lerp ONLY - never duration+easing
    wheelMultiplier: WHEEL_MULTIPLIER,
    touchMultiplier: TOUCH_MULTIPLIER,
    // Lenis 1.3.x defaults autoRaf:false - we drive it from gsap.ticker.
  });

  if (window.ScrollTrigger) {
    lenis.on('scroll', ScrollTrigger.update);
  }

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Re-measure after webfonts land - line boxes move (§6.2/§6.3).
  if (document.fonts && document.fonts.ready && window.ScrollTrigger) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }

  return lenis;
}
