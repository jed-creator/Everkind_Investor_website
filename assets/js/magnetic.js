/* magnetic.js
 * ─────────────────────────────────────────────────────────────
 * Magnetic buttons, cursor-tracking glow, card tilt + sheen,
 * CTA ember particles, and the custom cursor (§6.7).
 * All of it disabled under reduced motion; cursor also disabled
 * on coarse pointers. The native cursor and focus ring survive
 * everything.
 *
 * Exports: initMagnetic()
 *
 * TUNE:
 *   MAG_RADIUS   90  — px, magnetic capture distance
 *   MAG_PULL     12  — px, max button travel
 *   LABEL_LAG     6  — px, inner label travel (the lag sells it)
 *   TILT_MAX      6  — deg, card tilt ceiling
 *   PARTICLES    48  — pooled per CTA canvas, never allocated in-loop
 * ───────────────────────────────────────────────────────────── */
import { prefersReducedMotion, clamp, throttle } from './utils.js';
import { bloom } from './background.js';

const MAG_RADIUS = 90;
const MAG_PULL = 12;
const LABEL_LAG = 6;
const TILT_MAX = 6;
const PARTICLES = 48;

/* ── Magnetic buttons ────────────────────────────────────────
 * ONE throttled pointermove on document, iterating cached rects.
 * (A listener on the button never fires 90px away from it.) */
function magneticButtons() {
  const buttons = [...document.querySelectorAll('.btn--magnetic')];
  if (!buttons.length) return;

  const items = buttons.map((btn) => ({
    btn,
    label: btn.querySelector('.btn__label'),
    rect: null,
    xTo: gsap.quickTo(btn, 'x', { duration: .4, ease: 'power3.out' }),
    yTo: gsap.quickTo(btn, 'y', { duration: .4, ease: 'power3.out' }),
    lxTo: null, lyTo: null,
    active: false,
  }));
  items.forEach((it) => {
    if (it.label) {
      it.lxTo = gsap.quickTo(it.label, 'x', { duration: .45, ease: 'power3.out' });
      it.lyTo = gsap.quickTo(it.label, 'y', { duration: .45, ease: 'power3.out' });
    }
  });

  const cacheRects = () => items.forEach((it) => { it.rect = it.btn.getBoundingClientRect(); });
  cacheRects();
  window.addEventListener('scroll', throttle(cacheRects, 200), { passive: true });
  window.addEventListener('resize', throttle(cacheRects, 200));

  document.addEventListener('pointermove', throttle((e) => {
    for (const it of items) {
      if (!it.rect) continue;
      const cx = it.rect.left + it.rect.width / 2;
      const cy = it.rect.top + it.rect.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      const reach = MAG_RADIUS + Math.max(it.rect.width, it.rect.height) / 2;

      if (dist < reach) {
        it.active = true;
        const pull = 1 - clamp(dist / reach, 0, 1);
        it.xTo(dx * pull * (MAG_PULL / MAG_RADIUS) * 6);
        it.yTo(dy * pull * (MAG_PULL / MAG_RADIUS) * 6);
        if (it.lxTo) { it.lxTo(dx * pull * (LABEL_LAG / MAG_RADIUS) * 6); it.lyTo(dy * pull * (LABEL_LAG / MAG_RADIUS) * 6); }
      } else if (it.active) {
        it.active = false;
        gsap.to(it.btn, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1, 0.5)' });
        if (it.label) gsap.to(it.label, { x: 0, y: 0, duration: .8, ease: 'elastic.out(1, 0.5)' });
      }
    }
  }, 16), { passive: true });
}

/* ── Cursor-tracking glow inside buttons ─────────────────────── */
function buttonGlow() {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--glow-x', `${((e.clientX - r.left) / r.width) * 100}%`);
      btn.style.setProperty('--glow-y', `${((e.clientY - r.top) / r.height) * 100}%`);
    }, { passive: true });
    if (btn.classList.contains('btn--primary')) {
      btn.addEventListener('pointerenter', () => bloom(0.7), { passive: true });
    }
  });
}

/* ── Card tilt (max 6deg) + specular sheen ───────────────────── */
function cardTilt() {
  document.querySelectorAll('.card[data-tilt]').forEach((card) => {
    const max = Math.min(TILT_MAX, parseFloat(card.dataset.tilt) || TILT_MAX);
    const img = card.querySelector('img, svg.tilt-media');
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      gsap.to(card, { rotateY: px * max, rotateX: -py * max, transformPerspective: 700, duration: .5, ease: 'power2.out' });
      card.style.setProperty('--sheen-x', `${(px + .5) * 100}%`);
      card.style.setProperty('--sheen-y', `${(py + .5) * 100}%`);
      if (img) gsap.to(img, { scale: 1.03, duration: .5 });
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: .7, ease: 'power3.out' });
      if (img) gsap.to(img, { scale: 1, duration: .7 });
    }, { passive: true });
  });
}

/* ── Ember particles on primary CTAs (≤2/page, pooled) ───────── */
function ctaParticles() {
  const targets = [...document.querySelectorAll('.btn--particles')].slice(0, 2);
  targets.forEach((btn) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'particle-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    btn.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Pool — never allocate in the loop.
    const pool = Array.from({ length: PARTICLES }, () => ({ alive: false, x: 0, y: 0, vx: 0, vy: 0, born: 0, r: 0 }));
    let raf = null, lastSpawn = 0;

    const size = () => {
      const r = btn.getBoundingClientRect();
      canvas.width = Math.round((r.width + 80) * devicePixelRatio);
      canvas.height = Math.round((r.height + 80) * devicePixelRatio);
    };

    const step = (now) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let any = false;
      for (const p of pool) {
        if (!p.alive) continue;
        const age = (now - p.born) / 900;               // fade over 900ms
        if (age >= 1) { p.alive = false; continue; }
        any = true;
        p.x += p.vx; p.y += p.vy;
        p.vx += (Math.random() - .5) * .06;             // slight turbulence
        p.vy -= .015;                                    // embers drift up
        const t = 1 - age;
        // blush → violet
        ctx.fillStyle = `rgba(${Math.round(242 - 126 * age)}, ${Math.round(198 - 150 * age)}, ${Math.round(220 - 59 * age)}, ${t * .8})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * t, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = any ? requestAnimationFrame(step) : null;
    };

    btn.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - lastSpawn < 40) return;
      lastSpawn = now;
      if (!canvas.width) size();
      const r = canvas.getBoundingClientRect();
      const p = pool.find((q) => !q.alive);
      if (!p) return;
      p.alive = true; p.born = now;
      p.x = (e.clientX - r.left) * devicePixelRatio;
      p.y = (e.clientY - r.top) * devicePixelRatio;
      p.vx = (Math.random() - .5) * 1.1;
      p.vy = -(0.4 + Math.random() * .9);
      p.r = (1.4 + Math.random() * 2.4) * devicePixelRatio;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });

    window.addEventListener('resize', throttle(size, 300));
  });
}

/* ── Custom cursor: blush dot + trailing ring (§6.7) ─────────── */
function customCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot'; dot.setAttribute('aria-hidden', 'true');
  const ring = document.createElement('div');
  ring.className = 'cursor-ring'; ring.setAttribute('aria-hidden', 'true');
  ring.innerHTML = '<span class="cursor-ring__label">VIEW</span>';
  document.body.append(dot, ring);
  document.documentElement.classList.add('has-custom-cursor');

  const pos = { x: -100, y: -100 }, ringPos = { x: -100, y: -100 };
  const dotX = gsap.quickSetter(dot, 'x', 'px');
  const dotY = gsap.quickSetter(dot, 'y', 'px');
  const ringX = gsap.quickSetter(ring, 'x', 'px');
  const ringY = gsap.quickSetter(ring, 'y', 'px');

  window.addEventListener('pointermove', (e) => { pos.x = e.clientX; pos.y = e.clientY; }, { passive: true });
  gsap.ticker.add(() => {
    ringPos.x += (pos.x - ringPos.x) * .14;   // lerp 0.14
    ringPos.y += (pos.y - ringPos.y) * .14;
    dotX(pos.x); dotY(pos.y);
    ringX(ringPos.x); ringY(ringPos.y);
  });

  document.addEventListener('pointerover', (e) => {
    const view = e.target.closest('.deck, .news-card');
    const interactive = e.target.closest('a, button, input, [role="button"]');
    ring.classList.toggle('is-view', !!view && !!interactive);
    ring.classList.toggle('is-hover', !!interactive && !view);
  }, { passive: true });
}

export function initMagnetic() {
  if (prefersReducedMotion() || !window.gsap) return;
  magneticButtons();
  buttonGlow();
  cardTilt();
  ctaParticles();
  customCursor();
}
