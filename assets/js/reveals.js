/* reveals.js
 * ─────────────────────────────────────────────────────────────
 * The data-reveal system (§6.3), pinned sections (§6.4), parallax,
 * and the light-section scrim (§5.5). The client animates any new
 * element by adding an attribute — no JS required:
 *
 *   data-reveal="fade|lines|words|chars|image|stagger"
 *   data-reveal-delay="0.2"   data-reveal-from="left|right|scale"
 *
 * Exports: initReveals()
 *
 * TUNE:
 *   START        "top 82%" — when reveals fire
 *   STAGGER_MS   90        — ScrollTrigger.batch children
 *   RISE_PX      24        — fade rise distance
 * ───────────────────────────────────────────────────────────── */
import { prefersReducedMotion, onWidthResize } from './utils.js';

const START = 'top 82%';
const STAGGER_MS = 0.09;
const RISE_PX = 24;

const splits = [];

function fromVars(elm) {
  const dir = elm.dataset.revealFrom;
  if (dir === 'left') return { x: -40, y: 0 };
  if (dir === 'right') return { x: 40, y: 0 };
  if (dir === 'scale') return { scale: .92, y: 0 };
  return { y: RISE_PX };
}

function revealAllInstantly() {
  document.querySelectorAll('[data-reveal]').forEach((elm) => {
    elm.classList.add('is-revealed');
    elm.style.opacity = '1';
    elm.style.visibility = 'visible';
    if (elm.dataset.reveal === 'stagger') {
      [...elm.children].forEach((c) => { c.style.opacity = '1'; });
    }
  });
  document.documentElement.classList.add('no-pin');
  // Static pinned sections: activate every beat.
  document.querySelectorAll('.hiw__beat, .hiw__shot, .pillars__pillar, .pillars__shot')
    .forEach((n) => n.classList.add('is-active'));
  // Light scrims fully on, with their text tokens flipped to match.
  document.querySelectorAll('.light-scrim').forEach((s) => {
    s.style.opacity = '1';
    s.closest('.section--light')?.classList.add('is-lit');
  });
}

/* ── Split text (lines / words / chars) ─────────────────────── */
function splitReveal(elm, type) {
  const delay = parseFloat(elm.dataset.revealDelay || 0);
  const split = SplitText.create(elm, {
    type: type === 'lines' ? 'lines' : `${type},lines`,
    linesClass: 'split-line-mask',
    autoSplit: true,          // re-splits after fonts + on resize (§6.3 #1)
    aria: 'auto',             // screen readers hear the sentence (§6.3 #2)
    mask: 'lines',
    onSplit(self) {
      elm.classList.add('is-split');
      const targets = type === 'lines' ? self.lines : (type === 'words' ? self.words : self.chars);
      return gsap.from(targets, {
        yPercent: 110,
        duration: type === 'chars' ? .8 : 1,
        ease: 'expo.out',
        stagger: type === 'chars' ? .022 : .07,
        delay,
        scrollTrigger: { trigger: elm, start: START, once: true },
      });
    },
  });
  splits.push(split);
}

/* ── Light-section scrim (§5.5): the room's lights come up ──── */
function lightSections() {
  document.querySelectorAll('.section--light').forEach((section) => {
    const scrim = section.querySelector('.light-scrim');
    if (!scrim) return;
    gsap.fromTo(scrim, { opacity: 0 }, {
      opacity: 1, duration: .9, ease: 'power2.inOut',
      scrollTrigger: { trigger: section, start: 'top 62%', once: false, toggleActions: 'play none none reverse' },
      onUpdate: function () {
        // ≥95% opaque → tell the render loop it is occluded (§5.5).
        window.dispatchEvent(new CustomEvent('ek:occlusion', { detail: this.progress() > .95 && gsap.getProperty(scrim, 'opacity') > .95 }));
      },
      onComplete: () => window.dispatchEvent(new CustomEvent('ek:occlusion', { detail: true })),
      onReverseComplete: () => window.dispatchEvent(new CustomEvent('ek:occlusion', { detail: false })),
    });
    // Text tokens flip ~120ms AHEAD of the scrim (start: 64% vs 62%)
    // so copy is never dark-on-dark or light-on-light mid-transition.
    ScrollTrigger.create({
      trigger: section, start: 'top 64%',
      onEnter: () => section.classList.add('is-lit'),
      onLeaveBack: () => section.classList.remove('is-lit'),
    });
  });
}

/* ── Pinned beats: Home "How it works" + Product pillars ────── */
function pinnedBeats(rootSel, beatSel, shotSel) {
  const root = document.querySelector(rootSel);
  if (!root) return;
  const beats = root.querySelectorAll(beatSel);
  const shots = root.querySelectorAll(shotSel);
  if (beats.length < 2) return;

  const setActive = (i) => {
    beats.forEach((b, j) => b.classList.toggle('is-active', i === j));
    shots.forEach((s, j) => s.classList.toggle('is-active', i === j));
  };
  setActive(0);

  ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: `+=${beats.length * 85}%`,   // ~250vh for three beats
    pin: true,
    scrub: true,
    onUpdate(self) {
      const i = Math.min(beats.length - 1, Math.floor(self.progress * beats.length));
      setActive(i);
    },
  });
}

/* ── Company: dots resolve into one aggregate shape (§6.4 #3) ─ */
function insightsDots() {
  const wrap = document.querySelector('.iwi__canvas-wrap');
  if (!wrap) return;
  const canvas = wrap.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const DOTS = 220;
  const dots = [];

  const size = () => {
    const r = wrap.getBoundingClientRect();
    canvas.width = Math.max(2, Math.round(r.width * devicePixelRatio));
    canvas.height = Math.max(2, Math.round(r.height * devicePixelRatio));
  };
  size();
  onWidthResize(size);

  // Target: dots gather into one soft hexagon (the aggregate).
  const hexPoint = (i) => {
    const a = (i / DOTS) * Math.PI * 2;
    const R = 0.32 * (0.75 + 0.25 * Math.pow(Math.abs(Math.cos(a * 3)), .5));
    return { x: .5 + Math.cos(a) * R * (canvas.width / canvas.height), y: .5 + Math.sin(a) * R };
  };
  for (let i = 0; i < DOTS; i++) {
    const t = hexPoint(i);
    dots.push({
      sx: Math.random(), sy: Math.random(),
      tx: .5 + (t.x - .5) * Math.random() * .9,
      ty: .5 + (t.y - .5) * Math.random() * .9,
      r: 1 + Math.random() * 2.2,
    });
  }

  const draw = (p) => {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    for (const d of dots) {
      const x = (d.sx + (d.tx - d.sx) * p) * w;
      const y = (d.sy + (d.ty - d.sy) * p) * h;
      const near = Math.min(1, p * 1.2);
      ctx.beginPath();
      ctx.arc(x, y, d.r * devicePixelRatio, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${Math.round(169 + (242 - 169) * near)}, ${Math.round(107 + (198 - 107) * near)}, ${Math.round(173 + (220 - 173) * near)}, ${.35 + near * .5})`;
      ctx.fill();
    }
  };
  draw(0);

  if (prefersReducedMotion()) { draw(1); return; }

  ScrollTrigger.create({
    trigger: '.iwi',
    start: 'top top',
    end: '+=160%',
    pin: true,
    scrub: true,
    onUpdate: (self) => draw(gsap.parseEase('power2.inOut')(self.progress)),
  });
}

export function initReveals() {
  if (prefersReducedMotion() || !window.gsap || !window.ScrollTrigger) {
    revealAllInstantly();
    return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);

  document.querySelectorAll('[data-reveal]').forEach((elm) => {
    const kind = elm.dataset.reveal;
    const delay = parseFloat(elm.dataset.revealDelay || 0);

    if (kind === 'lines' || kind === 'words' || kind === 'chars') {
      splitReveal(elm, kind);
      return;
    }

    if (kind === 'image') {
      const img = elm.querySelector('img, svg');
      const tl = gsap.timeline({ scrollTrigger: { trigger: elm, start: START, once: true } });
      tl.to(elm, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power3.inOut', delay })
        .from(img, { scale: 1.08, duration: 1.4, ease: 'power2.out' }, '<');
      tl.eventCallback('onStart', () => elm.classList.add('is-revealed'));
      return;
    }

    if (kind === 'stagger') {
      elm.classList.add('is-revealed');
      ScrollTrigger.batch([...elm.children], {
        start: START,
        once: true,
        onEnter: (batch) => gsap.fromTo(batch,
          { opacity: 0, y: RISE_PX },
          { opacity: 1, y: 0, duration: .9, ease: 'expo.out', stagger: STAGGER_MS }),
      });
      return;
    }

    // default: fade
    gsap.fromTo(elm,
      { opacity: 0, ...fromVars(elm) },
      {
        opacity: 1, x: 0, y: 0, scale: 1,
        duration: .9, ease: 'expo.out', delay,
        scrollTrigger: { trigger: elm, start: START, once: true },
        onStart: () => elm.classList.add('is-revealed'),
      });
  });

  lightSections();

  /* Pinned moments — desktop only; small screens read stacked. */
  const canPin = window.matchMedia('(min-width: 980px)').matches;
  if (canPin) {
    pinnedBeats('.hiw', '.hiw__beat', '.hiw__shot');
    pinnedBeats('.pillars', '.pillars__pillar', '.pillars__shot');
    insightsDots();
  } else {
    document.documentElement.classList.add('no-pin');
    const iwi = document.querySelector('.iwi__canvas-wrap canvas');
    if (iwi) insightsDots();
  }

  /* Parallax layers: background -12%, mid -6%, content 0 (§6.4). */
  document.querySelectorAll('[data-parallax]').forEach((layer) => {
    const amount = layer.dataset.parallax === 'mid' ? -6 : -12;
    gsap.to(layer, {
      yPercent: amount, ease: 'none',
      scrollTrigger: { trigger: layer.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}
