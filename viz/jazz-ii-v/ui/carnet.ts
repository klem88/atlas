/**
 * Le carnet à l'écran : pour la progression choisie, la grille paliers × tonalités (meilleur tempo de chaque case),
 * la courbe des tempos tamponnés, un résumé de tout le carnet, et l'export / import.
 */
import { escapeHtml } from '@shell/html';
import { grilleTempos, resume, serie, type Tampon } from '@shell/music/logbook';
import { PALIERS } from '../domain/paliers';
import type { Progression } from '../domain/progressions';
import { CYCLE_QUARTES, tonicName } from '../domain/spelling';

export interface VueCarnet {
  tampons: readonly Tampon[];
  progression: Progression;
  palier: number;
  tonique: number;
}

/** Classes à seuils fixes : une couleur garde le même sens d'une progression à l'autre. */
export const SEUILS = [80, 120, 160, 200];
const classe = (bpm: number) => SEUILS.filter((s) => bpm >= s).length + 1;

const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const DATE_LONGUE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

export function dateCourte(iso: string): string {
  return DATE.format(new Date(iso));
}

export function rendreCarnet(el: HTMLElement, v: VueCarnet): void {
  const p = v.progression;
  const g = grilleTempos(v.tampons, p.id, PALIERS.length);
  const s = serie(v.tampons, p.id);
  const r = resume(v.tampons);
  const tete = CYCLE_QUARTES.map(
    (k) => `<th scope="col"${k === v.tonique ? ' class="courante" aria-current="true"' : ''}>${escapeHtml(tonicName(k, p.mode))}</th>`,
  ).join('');
  const lignes = PALIERS.map((pal, i) => {
    const cases = CYCLE_QUARTES.map((k) => {
      const bpm = g[i]![k];
      const cur = k === v.tonique && pal.n === v.palier ? ' courante' : '';
      return bpm ? `<td class="tempo-${classe(bpm)}${cur}">${bpm}</td>` : `<td class="vide${cur}"><span class="visually-hidden">pas encore</span></td>`;
    }).join('');
    return `<tr${pal.n === v.palier ? ' class="palier-courant"' : ''}><th scope="row">${pal.n}.<span class="palier-nom"> ${escapeHtml(pal.titre)}</span></th>${cases}</tr>`;
  }).join('');

  el.innerHTML = `
    <p class="jazz-aide">${escapeHtml(p.titre)} : ton meilleur tempo, à la noire, par palier et par tonalité.</p>
    <div class="table-scroll">
      <table class="carnet-grille">
        <thead><tr><th scope="col"><span class="visually-hidden">Palier</span></th>${tete}</tr></thead>
        <tbody>${lignes}</tbody>
      </table>
    </div>
    <p class="carnet-legende">
      ${SEUILS.map((_, i) => `<span class="tempo-${i + 1}">${i === 0 ? `moins de ${SEUILS[0]}` : `${SEUILS[i - 1]} à ${SEUILS[i]! - 1}`}</span>`).join('')}<span class="tempo-5">${SEUILS[SEUILS.length - 1]} et plus</span>
    </p>
    ${s.length ? courbe(s, v.palier) : `<p class="carnet-vide">Pas encore de tampon sur cette progression. Choisis un palier, joue, et appuie sur « J’y arrive » quand ça tient.</p>`}
    <p class="carnet-resume">${
      r.tampons
        ? `En tout, ${r.tampons} tampon${r.tampons > 1 ? 's' : ''} sur ${r.jours} jour${r.jours > 1 ? 's' : ''}, à ${r.tempoMoyen} à la noire en moyenne.`
        : 'Ton carnet est vide.'
    }</p>
    <div class="carnet-actions">
      <button type="button" class="button" data-exporter${r.tampons ? '' : ' disabled'}>Exporter le carnet</button>
      <label class="button">Importer un carnet<input type="file" accept="application/json,.json" data-importer class="visually-hidden" /></label>
      <button type="button" class="bouton-lien" data-annuler${r.tampons ? '' : ' disabled'}>Retirer le dernier tampon</button>
    </div>
    <p class="carnet-message" data-carnet-message role="status"></p>`;
  // Sur téléphone, le tableau défile : on amène la tonalité choisie au milieu.
  const zone = el.querySelector<HTMLElement>('.table-scroll');
  const colonne = el.querySelector<HTMLElement>('thead th.courante');
  if (zone && colonne) zone.scrollLeft = colonne.offsetLeft - zone.clientWidth / 2;
}

/** Les tempos tamponnés dans le temps : un point par tampon, ceux du palier choisi à l'accent. */
function courbe(s: readonly Tampon[], palier: number): string {
  const W = 640;
  const H = 180;
  const m = { g: 36, d: 12, h: 12, b: 26 };
  const t0 = Date.parse(s[0]!.at);
  const t1 = Math.max(Date.parse(s[s.length - 1]!.at), t0 + 86_400_000);
  const bpms = s.map((t) => t.bpm);
  const yMin = Math.max(20, Math.floor((Math.min(...bpms) - 20) / 20) * 20);
  const yMax = Math.ceil((Math.max(...bpms) + 20) / 20) * 20;
  const x = (iso: string) => m.g + ((Date.parse(iso) - t0) / (t1 - t0)) * (W - m.g - m.d);
  const y = (bpm: number) => H - m.b - ((bpm - yMin) / (yMax - yMin)) * (H - m.h - m.b);
  const pas = yMax - yMin > 120 ? 40 : 20;
  const graduations: number[] = [];
  for (let v = yMin; v <= yMax; v += pas) graduations.push(v);
  const autres = s.filter((t) => t.s !== palier);
  const siens = s.filter((t) => t.s === palier);
  const meilleur = siens.reduce<Tampon | null>((b, t) => (!b || t.bpm >= b.bpm ? t : b), null);
  const point = (t: Tampon, cls: string) =>
    `<circle class="${cls}" cx="${x(t.at).toFixed(1)}" cy="${y(t.bpm).toFixed(1)}" r="4.5"><title>${escapeHtml(DATE_LONGUE.format(new Date(t.at)))} · palier ${t.s} · ${t.bpm} à la noire</title></circle>`;
  return `<figure class="carnet-courbe">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tes tempos tamponnés dans le temps">
      ${graduations.map((v) => `<line class="filet" x1="${m.g}" x2="${W - m.d}" y1="${y(v)}" y2="${y(v)}"/><text class="graduation" x="${m.g - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`).join('')}
      <text class="graduation" x="${m.g}" y="${H - 6}">${escapeHtml(dateCourte(s[0]!.at))}</text>
      <text class="graduation" x="${W - m.d}" y="${H - 6}" text-anchor="end">${escapeHtml(dateCourte(new Date(t1).toISOString()))}</text>
      ${autres.map((t) => point(t, 'point')).join('')}
      ${siens.map((t) => point(t, 'point point-courant')).join('')}
      ${meilleur ? `<text class="etiquette" x="${Math.min(x(meilleur.at), W - 90).toFixed(1)}" y="${(y(meilleur.bpm) - 10).toFixed(1)}">record : ${meilleur.bpm}</text>` : ''}
    </svg>
    <figcaption>Chaque point est un tampon. En orange, le palier ${palier}.</figcaption>
  </figure>`;
}
