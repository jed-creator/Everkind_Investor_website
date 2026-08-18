/* news.js
 * ─────────────────────────────────────────────────────────────
 * Renders assets/data/news.json. ONE SOURCE, TWO SURFACES:
 * the same file drives the full News Room grid AND the
 * "3 most recent" blocks on Investors and Home.
 *
 *   <div data-news="recent"></div>  → 3 most recent, dated releases
 *   <div data-news="all"></div>     → full grid + filter chips
 *
 * Releases whose date is still a {{PLACEHOLDER}} (the pending
 * transaction releases) are excluded from "recent" and render in
 * the full grid as dashed pending cards.
 *
 * Exports: initNews()
 *
 * TUNE:
 *   RECENT_COUNT 3
 * ───────────────────────────────────────────────────────────── */
import { CONFIG, isSet } from './config.js';
import { el, formatDate, escapeHTML, prefersReducedMotion, HEX_PATH } from './utils.js';

const RECENT_COUNT = 3;

let cache = null;
async function loadReleases() {
  if (cache) return cache;
  const res = await fetch(CONFIG.NEWS_JSON);
  const data = await res.json();
  cache = (data.releases || []);
  return cache;
}

const dated = (releases) =>
  releases.filter((r) => isSet(r.date))
    .sort((a, b) => b.date.localeCompare(a.date));

function releaseCard(r) {
  const pending = !isSet(r.date);
  const hasUrl = isSet(r.url);
  const tag = hasUrl ? 'a' : 'article';
  const card = el(tag, {
    class: 'card news-card' + (pending ? ' pending-release' : ''),
    ...(hasUrl ? { href: r.url, target: '_blank', rel: 'noopener' } : {}),
  });
  card.dataset.category = r.category || 'Corporate';

  const bullet = `<svg class="hex-bullet" viewBox="0 0 100 108" aria-hidden="true"><path d="${HEX_PATH}" fill="#7B2CBF"/></svg>`;
  const dateText = pending ? 'Date pending - add release' : formatDate(r.date);
  const summary = isSet(r.summary) ? r.summary
    : 'Summary pending sign-off. Quote figures verbatim from the release. See assets/data/news.json.';

  card.innerHTML = `
    <div class="news-card__meta">${bullet}
      <span class="news-card__date">${escapeHTML(dateText || '')}</span>
      <span class="chip">${escapeHTML(r.category || 'Corporate')}</span>
    </div>
    <h3 class="news-card__title">${escapeHTML(r.title)}</h3>
    <p class="news-card__summary">${escapeHTML(summary)}</p>
    ${hasUrl
      ? '<span class="link-arrow">Read release <span class="arr" aria-hidden="true">→</span></span>'
      : '<span class="link-arrow muted" style="color:var(--text-muted)">Release URL pending: {{URL}} in news.json</span>'}
    <span class="card__sheen" aria-hidden="true"></span>`;
  return card;
}

export async function initNews() {
  const mounts = document.querySelectorAll('[data-news]');
  if (!mounts.length) return;

  let releases;
  try { releases = await loadReleases(); }
  catch (err) {
    mounts.forEach((m) => {
      m.append(el('p', { class: 'muted', text: 'News releases are temporarily unavailable.' }));
    });
    return;
  }

  mounts.forEach((mount) => {
    const mode = mount.dataset.news;

    if (mode === 'recent') {
      /* Compact vertical list - date + title only, newest first. */
      const top = dated(releases).slice(0, RECENT_COUNT);
      top.forEach((r) => {
        const hasUrl = isSet(r.url);
        const row = el(hasUrl ? 'a' : 'article', {
          class: 'news-row',
          ...(hasUrl ? { href: r.url, target: '_blank', rel: 'noopener' } : {}),
        });
        row.innerHTML = `
          <span class="news-row__date">${escapeHTML(formatDate(r.date) || '')}</span>
          <span class="news-row__title">${escapeHTML(r.title)}</span>
          ${hasUrl ? '<span class="arr" aria-hidden="true">→</span>' : ''}`;
        mount.append(row);
      });
      return;
    }

    /* mode === 'all': CollectionPage + ItemList structured data -
       references only, pointing at each canonical release. NOT
       NewsArticle: the bodies live elsewhere (§11.4). Only releases
       with real URLs are included. */
    const withUrls = dated(releases).filter((r) => isSet(r.url));
    if (withUrls.length) {
      const ld = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Everkind News Room',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: withUrls.map((r, i) => ({
            '@type': 'ListItem', position: i + 1, name: r.title, url: r.url,
          })),
        },
      };
      const s = document.createElement('script');
      s.type = 'application/ld+json';
      s.textContent = JSON.stringify(ld);
      document.head.appendChild(s);
    }

    /* Pending (undated) transaction releases render first as dashed
       pending cards, then dated releases reverse-chronological. */
    const pending = releases.filter((r) => !isSet(r.date));
    const rest = dated(releases);
    const cards = [...pending, ...rest].map((r) => {
      const c = releaseCard(r);
      mount.append(c);
      return c;
    });

    /* Filter chips animate the grid with GSAP Flip (§10.5). */
    const filterBar = document.querySelector('[data-news-filters]');
    if (!filterBar) return;
    const categories = ['All', ...new Set(releases.map((r) => r.category).filter(Boolean))];
    categories.forEach((cat, i) => {
      const chip = el('button', {
        class: 'chip chip--filter', type: 'button',
        'aria-pressed': i === 0 ? 'true' : 'false', text: cat,
      });
      chip.addEventListener('click', () => {
        filterBar.querySelectorAll('.chip--filter').forEach((c) => c.setAttribute('aria-pressed', 'false'));
        chip.setAttribute('aria-pressed', 'true');

        const useFlip = !prefersReducedMotion() && window.gsap && window.Flip;
        const state = useFlip ? Flip.getState(cards) : null;
        cards.forEach((c) => {
          c.style.display = (cat === 'All' || c.dataset.category === cat) ? '' : 'none';
        });
        if (useFlip) {
          Flip.from(state, {
            duration: .6, ease: 'power3.inOut', stagger: .03, absolute: true,
            onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: .94 }, { opacity: 1, scale: 1, duration: .5 }),
            onLeave: (els) => gsap.to(els, { opacity: 0, scale: .94, duration: .3 }),
          });
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        }
      });
      filterBar.append(chip);
    });
  });
}
