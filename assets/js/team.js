/* team.js
 * ─────────────────────────────────────────────────────────────
 * Renders assets/data/team.json into [data-team="leadership|
 * board|advisors"] mounts. Missing headshots fall back to a
 * branded initials avatar — a rounded hexagon (the logo
 * geometry) filled violet→blush, initials in Crimson Pro, at the
 * exact dimensions a real photo will occupy (§7.3).
 * Click opens a <dialog> with the full bio.
 *
 * Exports: initTeam()
 * ───────────────────────────────────────────────────────────── */
import { CONFIG, isSet } from './config.js';
import { el, escapeHTML, HEX_PATH } from './utils.js';

const initials = (name) =>
  name.replace(/^Dr\.\s+/i, '').split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

let avatarSeq = 0;
function portrait(person) {
  if (isSet(person.photo)) {
    return `<img src="${escapeHTML(person.photo)}" alt="Portrait of ${escapeHTML(person.name)}"
      width="108" height="118" loading="lazy" class="team-card__portrait"
      style="object-fit:cover;clip-path:path('${HEX_PATH}')">`;
  }
  const gid = `av-grad-${avatarSeq++}`;
  return `<svg class="team-card__portrait" viewBox="0 0 100 108" role="img"
      aria-label="Placeholder avatar for ${escapeHTML(person.name)}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7A27B2"/><stop offset="1" stop-color="#C9A7E6"/>
    </linearGradient></defs>
    <path d="${HEX_PATH}" fill="url(#${gid})" opacity=".9"/>
    <text x="50" y="60" text-anchor="middle" font-family="Crimson Pro, Georgia, serif"
      font-size="34" fill="#FDF6F4">${escapeHTML(initials(person.name))}</text>
  </svg>`;
}

function bioDialog() {
  let dlg = document.querySelector('.bio-dialog');
  if (dlg) return dlg;
  dlg = el('dialog', { class: 'bio-dialog' });
  dlg.innerHTML = `
    <button class="bio-dialog__close" type="button" aria-label="Close">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    </button>
    <div class="bio-dialog__body stack-sm"></div>`;
  dlg.querySelector('.bio-dialog__close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  document.body.append(dlg);
  return dlg;
}

function openBio(person) {
  const dlg = bioDialog();
  const body = dlg.querySelector('.bio-dialog__body');
  const bio = isSet(person.bio) ? escapeHTML(person.bio)
    : 'Biography pending sign-off — add it in assets/data/team.json. ({{BIO}})';
  body.innerHTML = `
    ${portrait(person)}
    <h3>${escapeHTML(person.name)}</h3>
    <p class="muted">${escapeHTML(person.title)}</p>
    ${person.note ? `<p class="team-card__note">${escapeHTML(person.note)}</p>` : ''}
    <p>${bio}</p>
    ${isSet(CONFIG.LINKEDIN_URL) ? `<a class="link-arrow" href="${escapeHTML(CONFIG.LINKEDIN_URL)}" target="_blank" rel="noopener">LinkedIn <span class="arr" aria-hidden="true">→</span></a>` : ''}`;
  dlg.showModal();
}

export async function initTeam() {
  const mounts = document.querySelectorAll('[data-team]');
  if (!mounts.length) return;

  let data;
  try {
    const res = await fetch(CONFIG.TEAM_JSON);
    data = await res.json();
  } catch (err) {
    mounts.forEach((m) => m.append(el('p', { class: 'muted', text: 'Team information is temporarily unavailable.' })));
    return;
  }

  mounts.forEach((mount) => {
    const group = data[mount.dataset.team] || [];
    group.forEach((person) => {
      const card = el('button', { class: 'card team-card', type: 'button', 'data-tilt': '5' });
      card.innerHTML = `
        ${portrait(person)}
        <p class="team-card__name">${escapeHTML(person.name)}</p>
        <p class="team-card__title">${escapeHTML(person.title)}</p>
        ${person.note ? `<p class="team-card__note">${escapeHTML(person.note)}</p>` : ''}
        <span class="card__sheen" aria-hidden="true"></span>`;
      card.setAttribute('aria-haspopup', 'dialog');
      card.setAttribute('aria-label', `${person.name}, ${person.title}. Open biography.`);
      card.addEventListener('click', () => openBio(person));
      mount.append(card);
    });
  });
}
