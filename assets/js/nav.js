/* nav.js
 * ─────────────────────────────────────────────────────────────
 * Header behaviour + mobile menu (§10.1):
 *  - hairline fades in after 80px of scroll
 *  - header hides on scroll-down past 400px, returns on scroll-up
 *  - hamburger opens a full-screen menu; links stagger at 60ms;
 *    focus is trapped and returned to the trigger on close
 *  - nav links get the two-copy character stack
 *  - marks the current page with aria-current
 *
 * Exports: initNav()
 *
 * TUNE:
 *   HAIRLINE_AT   80  — px scrolled before the bottom line shows
 *   HIDE_AFTER   400  — px scrolled before hide-on-down kicks in
 *   MENU_STAGGER  60  — ms between mobile links
 * ───────────────────────────────────────────────────────────── */
import { prefersReducedMotion } from './utils.js';

const HAIRLINE_AT = 80;
const HIDE_AFTER = 400;
const MENU_STAGGER = 60;

export function initNav() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  /* current page */
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-nav a, .mobile-menu nav a').forEach((a) => {
    const target = a.getAttribute('href').split('#')[0];
    if (target === here) a.setAttribute('aria-current', 'page');
  });

  /* two-copy character stack on desktop nav links */
  if (!prefersReducedMotion()) {
    document.querySelectorAll('.site-nav .nav-link').forEach((a) => {
      const text = a.textContent.trim();
      a.setAttribute('aria-label', text);
      a.innerHTML = `<span class="nav-link__stack" aria-hidden="true">
        <span class="nav-link__copy nav-link__copy--main">${text}</span>
        <span class="nav-link__copy nav-link__copy--ghost">${text}</span>
      </span>`;
    });
  }

  /* scroll behaviour */
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > HAIRLINE_AT);
    if (y > HIDE_AFTER && y > lastY + 4) header.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= HIDE_AFTER) header.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  /* mobile menu */
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (!toggle || !menu) return;

  const links = [...menu.querySelectorAll('.mobile-menu__link, .mobile-menu .btn')];
  let open = false;

  const setOpen = (next) => {
    open = next;
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (open) {
      links.forEach((l, i) => { l.style.transitionDelay = `${i * MENU_STAGGER}ms`; });
      (links[0] || menu).focus({ preventScroll: true });
    } else {
      links.forEach((l) => { l.style.transitionDelay = '0ms'; });
      toggle.focus({ preventScroll: true });
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });

  /* focus trap + escape */
  document.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key !== 'Tab') return;
    const focusables = [toggle, ...links];
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
