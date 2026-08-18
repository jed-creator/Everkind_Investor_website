/* morph.js
 * ─────────────────────────────────────────────────────────────
 * MorphSVG blob morphing (§6.5). Blobs are Everkind's shape
 * language. Each .blob-wrap svg's path loops through 5 hand-
 * authored blob shapes on a slow ~8s power1.inOut cycle, and a
 * ScrollTrigger offset nudges the morph forward as you scroll.
 * Blur is CSS filter:blur() on the wrapper (GPU-composited) —
 * NOT an SVG feGaussianBlur re-rasterising every frame.
 *
 * Exports: initMorph()
 *
 * TUNE:
 *   LOOP_S    8   — seconds per morph step
 *   OPACITY  .18  — blob fill opacity (12–22% band)
 * ───────────────────────────────────────────────────────────── */
import { prefersReducedMotion } from './utils.js';

const LOOP_S = 8;

/* Five hand-authored blob paths, same-ish bounding box.
   MorphSVG handles differing point counts itself. */
const BLOBS = [
  'M389,285Q371,320,345,349Q319,378,281,391Q243,404,203,396Q163,388,131,363Q99,338,84,301Q69,264,77,225Q85,186,106,152Q127,118,163,99Q199,80,240,79Q281,78,317,97Q353,116,376,150Q399,184,403,222Q407,260,389,285Z',
  'M377,297Q351,334,315,357Q279,380,236,385Q193,390,157,367Q121,344,98,309Q75,274,77,232Q79,190,101,155Q123,120,158,99Q193,78,236,77Q279,76,315,97Q351,118,377,153Q403,188,403,232Q403,276,377,297Z',
  'M396,270Q389,310,362,341Q335,372,296,388Q257,404,215,397Q173,390,140,366Q107,342,88,306Q69,270,73,228Q77,186,99,150Q121,114,158,95Q195,76,238,78Q281,80,318,99Q355,118,379,152Q403,186,403,228Q403,270,396,270Z',
  'M371,289Q357,328,327,354Q297,380,255,389Q213,398,172,384Q131,370,105,336Q79,302,74,259Q69,216,87,177Q105,138,140,113Q175,88,219,82Q263,76,303,94Q343,112,367,148Q391,184,388,226Q385,268,371,289Z',
  'M384,278Q373,316,347,347Q321,378,281,392Q241,406,199,398Q157,390,127,362Q97,334,83,296Q69,258,79,218Q89,178,113,146Q137,114,174,96Q211,78,252,81Q293,84,326,105Q359,126,379,161Q399,196,396,237Q393,278,384,278Z',
];

export function initMorph() {
  if (prefersReducedMotion() || !window.gsap || !window.MorphSVGPlugin) return;
  gsap.registerPlugin(MorphSVGPlugin, ScrollTrigger);

  document.querySelectorAll('.blob-wrap path.blob').forEach((path, idx) => {
    // Stagger which shape each blob starts on so no two move in sync.
    const order = BLOBS.slice(idx % BLOBS.length).concat(BLOBS.slice(0, idx % BLOBS.length));

    const tl = gsap.timeline({ repeat: -1, yoyo: false, defaults: { duration: LOOP_S, ease: 'power1.inOut' } });
    order.forEach((d, i) => {
      tl.to(path, { morphSVG: order[(i + 1) % order.length] });
    });

    // Scroll nudges the morph forward.
    const section = path.closest('section') || path.closest('.blob-wrap').parentElement;
    if (section) {
      ScrollTrigger.create({
        trigger: section, start: 'top bottom', end: 'bottom top', scrub: 1.2,
        onUpdate: (self) => { tl.timeScale(1 + self.getVelocity() / 4000); },
      });
    }
  });
}
