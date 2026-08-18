/* deck.js
 * ─────────────────────────────────────────────────────────────
 * The investor deck widget (§8.2). Slides come from deck.json and
 * render as LIVE HTML — selectable, searchable, translatable,
 * screen-reader accessible. Deliberately NOT pinned (§6.4).
 *
 * Navigation: prev/next, hexagon dots, ←/→, Home/End, touch swipe,
 * progress scrubber, fullscreen (with focus trap), and an unpinned
 * scroll-advance active only while in view and only until the user
 * interacts. Deep link: investors.html#deck-7.
 *
 * Exports: initDeck()
 *
 * TUNE:
 *   TRANS_MS   620 — slide transition
 *   OVERLAP_MS 180 — in/out overlap
 *   SWIPE_PX    48 — touch threshold
 * ───────────────────────────────────────────────────────────── */
import { CONFIG, isSet } from './config.js';
import { el, escapeHTML, prefersReducedMotion, HEX_PATH } from './utils.js';

const TRANS_MS = 620;
const OVERLAP_MS = 180;
const SWIPE_PX = 48;

export async function initDeck() {
  const root = document.querySelector('[data-deck]');
  if (!root) return;

  let data;
  try {
    const res = await fetch(CONFIG.DECK_MANIFEST);
    data = await res.json();
  } catch (err) {
    root.innerHTML = '';
    root.append(el('p', { class: 'muted', text: 'Deck unavailable. Download the PDF below or contact ' + CONFIG.IR_EMAIL + '.' }));
    return;
  }

  const slides = data.slides || [];
  if (!slides.length) return;
  let index = 0;
  let userTouched = false;
  let animating = false;

  /* ── Structure ── */
  root.classList.add('deck');
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carousel');
  root.setAttribute('aria-label', 'Everkind investor presentation');

  const skip = el('a', { class: 'skip-link', href: '#after-deck', text: 'Skip deck' });
  const stage = el('div', { class: 'deck__stage' });
  stage.setAttribute('data-lenis-prevent', '');
  const live = el('div', { class: 'visually-hidden', 'aria-live': 'polite' });

  const slideEls = slides.map((s, i) => {
    const node = el('div', { class: 'deck__slide' + (s.variant === 'title' ? ' deck__slide--title' : ''), role: 'group', 'aria-roledescription': 'slide', 'aria-label': `Slide ${i + 1} of ${slides.length}: ${s.title}` });
    // [DRAFT — PENDING SIGN-OFF] — every slide ships as draft; a named
    // executive promotes copy, never the build.
    let html = '';
    if (s.kicker) html += `<p class="deck__slide-kicker">${escapeHTML(s.kicker)}</p>`;
    html += `<h3>${escapeHTML(s.title)}</h3>`;
    if (s.body) html += `<p>${escapeHTML(s.body)}</p>`;
    if (s.bullets && s.bullets.length) {
      html += '<ul>' + s.bullets.map((b) => `<li>${escapeHTML(b)}</li>`).join('') + '</ul>';
    }
    if (s.fine) html += `<p class="deck__fine muted">${escapeHTML(s.fine)}</p>`;
    node.innerHTML = html;
    stage.append(node);
    return node;
  });

  /* chrome */
  const hexDot = () => `<svg viewBox="0 0 100 108" aria-hidden="true"><path d="${HEX_PATH}" fill="currentColor"/></svg>`;
  const prevBtn = el('button', { class: 'deck__nav-btn', type: 'button', 'aria-label': 'Previous slide', html: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 2 4 8l6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' });
  const nextBtn = el('button', { class: 'deck__nav-btn', type: 'button', 'aria-label': 'Next slide', html: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' });
  const counter = el('span', { class: 'deck__counter', 'aria-hidden': 'true' });
  const dots = el('div', { class: 'deck__dots', role: 'tablist', 'aria-label': 'Slides' });
  const dotEls = slides.map((s, i) => {
    const d = el('button', { class: 'deck__dot', type: 'button', role: 'tab', 'aria-label': `Go to slide ${i + 1}: ${s.title}`, html: hexDot(), style: 'color: var(--ek-orchid)' });
    d.addEventListener('click', () => { userTouched = true; go(i); });
    dots.append(d);
    return d;
  });
  const progress = el('input', { class: 'deck__progress', type: 'range', min: '0', max: String(slides.length - 1), step: '1', value: '0', 'aria-label': 'Slide position' });
  progress.addEventListener('input', () => { userTouched = true; go(parseInt(progress.value, 10)); });
  const fsBtn = el('button', { class: 'deck__nav-btn', type: 'button', 'aria-label': 'Toggle fullscreen', html: '<svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' });

  const chrome = el('div', { class: 'deck__chrome' });
  chrome.append(prevBtn, nextBtn, counter, dots, progress, fsBtn);

  root.innerHTML = '';
  root.append(skip, stage, live, chrome);
  const after = el('div', { id: 'after-deck' });
  root.insertAdjacentElement('afterend', after);

  /* ── Transitions ── */
  const show = (next, dir = 1) => {
    if (next === index && slideEls[index].classList.contains('is-active')) return;
    const out = slideEls[index];
    const inn = slideEls[next];
    index = next;

    counter.textContent = `${String(next + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    progress.value = String(next);
    dotEls.forEach((d, i) => d.setAttribute('aria-current', i === next ? 'true' : 'false'));
    prevBtn.disabled = next === 0;
    nextBtn.disabled = next === slides.length - 1;
    live.textContent = `Slide ${next + 1} of ${slides.length}: ${slides[next].title}`;
    try { history.replaceState(null, '', `#deck-${next + 1}`); } catch (_) {}

    if (prefersReducedMotion() || !window.gsap) {
      slideEls.forEach((s, i) => s.classList.toggle('is-active', i === next));
      return;
    }
    animating = true;
    inn.classList.add('is-active');
    gsap.set(inn, { y: 40 * dir, opacity: 0, clipPath: dir > 0 ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)' });
    gsap.to(out, {
      opacity: 0, scale: .97, filter: 'blur(6px)', duration: TRANS_MS / 1000, ease: 'power2.in',
      onComplete: () => { out.classList.remove('is-active'); gsap.set(out, { clearProps: 'all' }); },
    });
    gsap.to(inn, {
      y: 0, opacity: 1, clipPath: 'inset(0% 0 0% 0)',
      duration: TRANS_MS / 1000, ease: 'expo.out', delay: (TRANS_MS - OVERLAP_MS) / 2000,
      onComplete: () => { animating = false; gsap.set(inn, { clearProps: 'filter,scale' }); },
    });
  };

  const go = (i) => {
    const next = Math.max(0, Math.min(slides.length - 1, i));
    if (next !== index) show(next, next > index ? 1 : -1);
  };

  prevBtn.addEventListener('click', () => { userTouched = true; go(index - 1); });
  nextBtn.addEventListener('click', () => { userTouched = true; go(index + 1); });

  /* keyboard */
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { userTouched = true; go(index + 1); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { userTouched = true; go(index - 1); e.preventDefault(); }
    else if (e.key === 'Home') { userTouched = true; go(0); e.preventDefault(); }
    else if (e.key === 'End') { userTouched = true; go(slides.length - 1); e.preventDefault(); }
  });
  root.tabIndex = -1;

  /* touch swipe */
  let touchX = null;
  stage.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > SWIPE_PX) { userTouched = true; go(index + (dx < 0 ? 1 : -1)); }
    touchX = null;
  }, { passive: true });

  /* fullscreen with focus trap + return */
  let lastFocus = null;
  fsBtn.addEventListener('click', async () => {
    userTouched = true;
    if (document.fullscreenElement === root) {
      await document.exitFullscreen().catch(() => {});
    } else if (root.requestFullscreen) {
      lastFocus = document.activeElement;
      await root.requestFullscreen().catch(() => {});
      root.focus({ preventScroll: true });
    }
  });
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && lastFocus) { lastFocus.focus({ preventScroll: true }); lastFocus = null; }
  });
  root.addEventListener('keydown', (e) => {
    if (document.fullscreenElement !== root || e.key !== 'Tab') return;
    const f = [...root.querySelectorAll('button, [href], input')].filter((n) => !n.disabled);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* unpinned scroll-advance: in-view, first pass only (§6.4) */
  if (!prefersReducedMotion() && window.ScrollTrigger) {
    let lastAuto = 0;
    ScrollTrigger.create({
      trigger: root, start: 'top 70%', end: 'bottom 30%',
      onUpdate(self) {
        if (userTouched) return;
        const target = Math.min(slides.length - 1, Math.floor(self.progress * 4));
        const now = performance.now();
        if (target > index && now - lastAuto > TRANS_MS + 200) { lastAuto = now; show(target, 1); }
      },
    });
  }

  /* deep link #deck-N on cold load: suppress native hash scroll,
     wait for refresh, then scroll + set slide (§8.2) */
  const m = location.hash.match(/^#deck-(\d+)$/);
  const startAt = m ? Math.max(0, Math.min(slides.length - 1, parseInt(m[1], 10) - 1)) : 0;
  if (m) {
    userTouched = true;
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    setTimeout(() => {
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      root.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' });
    }, 150);
  }

  /* initial state */
  slideEls[startAt].classList.add('is-active');
  index = startAt;
  counter.textContent = `${String(startAt + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  progress.value = String(startAt);
  dotEls.forEach((d, i) => d.setAttribute('aria-current', i === startAt ? 'true' : 'false'));
  prevBtn.disabled = startAt === 0;
  nextBtn.disabled = startAt === slides.length - 1;

  /* download row: verify the PDF actually exists (HEAD); if it
     404s, swap in "available on request" (§8.2). */
  const dl = document.querySelector('[data-deck-download]');
  if (dl) {
    fetch(CONFIG.DECK_PDF, { method: 'HEAD' }).then((r) => {
      if (!r.ok) throw new Error();
      dl.href = CONFIG.DECK_PDF;
      const size = r.headers.get('content-length');
      const meta = document.querySelector('[data-deck-meta]');
      if (meta) {
        const version = isSet(CONFIG.DECK_VERSION) ? CONFIG.DECK_VERSION : null;
        const bytes = size ? parseInt(size, 10) : 0;
        const kb = bytes ? (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`) : null;
        meta.textContent = ['PDF', kb, version].filter(Boolean).join(' · ');
      }
    }).catch(() => {
      const row = dl.closest('.deck-download-row');
      if (row) {
        row.innerHTML = '';
        row.append(el('p', { class: 'muted', html: `Deck available on request — <a href="mailto:${CONFIG.IR_EMAIL}">${CONFIG.IR_EMAIL}</a>` }));
      }
    });
  }
}
