/** Le ruban : les accords joués, en jetons, sur des bandes nommées par tonalité ; le pivot chevauche deux bandes. */
import { escapeHtml } from '@shell/html';
import { keyName, nameOf } from '../../suis-les-fleches/domain/harmony';
import { bandsOf, type Journey } from '../domain/journey';
import { pivotTip, RIBBON_TIP } from '../domain/notes';

/** Nombre de pas au rendu précédent. */
let lastCount = -1;

/** `selected` : l’indice du jeton consulté (fiche ouverte), ou null. */
export function renderRibbon(root: HTMLElement, j: Journey, selected: number | null = null) {
  root.dataset.tip = RIBBON_TIP;
  if (!j.steps.length) {
    lastCount = 0;
    root.innerHTML = `<p class="ribbon-empty">Ta progression s’écrira ici.</p>`;
    return;
  }
  const last = j.steps.length - 1;
  const bands = bandsOf(j)
    .map((b) => {
      const tokens = j.steps
        .slice(b.from, b.to + 1)
        .map((s, k) => {
          const i = b.from + k;
          const classes = ['token', i === last ? 'is-last' : '', s.pivot ? 'is-pivot' : '', j.pending !== null && i >= j.pending ? 'is-pending' : '', i === selected ? 'is-selected' : ''].filter(Boolean).join(' ');
          const sub = s.pivot ? `${s.pivot.before} → ${s.pivot.after}` : s.label;
          const tip = s.pivot ? ` data-tip="${escapeHtml(pivotTip(s.chord, s.pivot.before, s.pivot.after))}"` : '';
          return `<li><button type="button" class="${classes}" data-index="${i}" aria-pressed="${i === selected}"${tip}><span class="token-name">${escapeHtml(nameOf(s.chord))}</span><span class="token-sub">${escapeHtml(sub)}</span></button></li>`;
        })
        .join('');
      return `<li class="band${b.key === j.key ? ' is-current' : ''}"><span class="band-name">${escapeHtml(keyName(b.key))}</span><ol class="band-tokens">${tokens}</ol></li>`;
    })
    .join('');
  const leaning = j.leaning !== null ? `<li class="band band--leaning"><span class="band-name">vers ${escapeHtml(keyName(j.leaning))} ?</span></li>` : '';
  root.innerHTML = `<ol class="ribbon-bands">${bands}${leaning}</ol>`;
  // On ne recale à droite que si le chemin a changé (et pas pendant une consultation) : un simple survol ne ramène pas un ruban qu'on a fait défiler.
  if (selected === null && j.steps.length !== lastCount) root.scrollLeft = root.scrollWidth;
  lastCount = j.steps.length;
}
