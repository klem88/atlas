/**
 * Dessin de la portée en SVG : un accord par mesure, en rondes ; des fils relient les notes d'une même voix d'un accord
 * à l'autre (celui de la basse plus marqué). Les mesures allumées (endroits possibles) se touchent ; les notes qui
 * bougent dans les accords changés prennent l'accent.
 */
import { escapeHtml } from '@shell/html';
import type { Voix } from '@shell/music/realisation';
import type { Grille } from '../domain/grille';
import { HAUTEUR_SYSTEME, INTERLIGNE, Y_FA, Y_SOL, placerAccord } from '../domain/portee';

export interface VuePortee {
  grille: Grille;
  voix: readonly Voix[];
  noms: readonly string[];
  /** Largeur disponible, en pixels CSS. */
  largeur: number;
  /** Mesures allumées : les endroits possibles de la ficelle choisie. */
  allumes: ReadonlySet<number>;
  /** Accords ajoutés ou changés par la ficelle en aperçu. */
  touches: ReadonlySet<number>;
  /** La mesure qui sonne. */
  curseur: number | null;
}

const MARGE_CLE = 46;
const ALTERATION = ['𝄫', '♭', '', '♯', '𝄪'];
/** Une ronde : ovale plein, trou incliné (règle de remplissage pair-impair). */
const RONDE = 'M-7 0a7 5 0 1 0 14 0a7 5 0 1 0-14 0ZM-4 0a4 2.4 -35 1 1 8 0a4 2.4 -35 1 1-8 0Z';

export const mesuresParLigne = (largeur: number) => (largeur < 520 ? 2 : 4);

export function dessinerPortee(v: VuePortee): string {
  const n = mesuresParLigne(v.largeur);
  const systemes = Math.max(1, Math.ceil(v.grille.length / n));
  const w = (v.largeur - MARGE_CLE) / n;
  const ligneDe = (i: number) => Math.floor(i / n);
  const cx = (i: number) => MARGE_CLE + (i % n) * w + w / 2;
  const placees = v.voix.map((vx, i) => placerAccord(vx, v.grille[i]!));
  const fonds: string[] = [];
  const traits: string[] = [];
  const fils: string[] = [];
  const notes: string[] = [];

  for (let s = 0; s < systemes; s++) {
    const y0 = s * HAUTEUR_SYSTEME;
    const nb = Math.min(n, v.grille.length - s * n);
    const fin = MARGE_CLE + nb * w;
    for (const haut of [Y_SOL, Y_FA])
      for (let k = 0; k < 5; k++) {
        const y = y0 + haut + k * INTERLIGNE;
        traits.push(`<line class="ligne" x1="4" x2="${fin}" y1="${y}" y2="${y}"/>`);
      }
    traits.push(`<line class="barre" x1="4" x2="4" y1="${y0 + Y_SOL}" y2="${y0 + Y_FA + 4 * INTERLIGNE}"/>`);
    for (let m = 1; m <= nb; m++) {
      const x = MARGE_CLE + m * w;
      traits.push(`<line class="barre" x1="${x}" x2="${x}" y1="${y0 + Y_SOL}" y2="${y0 + Y_FA + 4 * INTERLIGNE}"/>`);
    }
    traits.push(`<text class="cle" x="8" y="${y0 + Y_SOL + 3 * INTERLIGNE}">𝄞</text>`);
    traits.push(`<text class="cle" x="8" y="${y0 + Y_FA + INTERLIGNE}">𝄢</text>`);
  }

  v.grille.forEach((_, i) => {
    const y0 = ligneDe(i) * HAUTEUR_SYSTEME;
    const gauche = MARGE_CLE + (i % n) * w;
    const allumee = v.allumes.has(i);
    const cls = ['mesure', allumee && 'allumee', v.curseur === i && 'joue', v.touches.has(i) && 'touchee'].filter(Boolean).join(' ');
    const geste = allumee ? ` tabindex="0" role="button" aria-label="Endroit : ${escapeHtml(v.noms[i]!)}"` : '';
    fonds.push(`<rect class="${cls}" data-i="${i}" x="${gauche + 2}" y="${y0 + 4}" width="${w - 4}" height="${HAUTEUR_SYSTEME - 8}" rx="6"${geste}/>`);
    notes.push(`<text class="nom${v.touches.has(i) ? ' touche' : ''}" x="${cx(i)}" y="${y0 + 22}" text-anchor="middle">${escapeHtml(v.noms[i]!)}</text>`);
  });

  placees.forEach((accord, i) => {
    const y0 = ligneDe(i) * HAUTEUR_SYSTEME;
    for (const note of accord) {
      const x = cx(i) + (note.decale ? 13 : 0);
      const bouge = v.touches.has(i) && (i === 0 || v.voix[i]![note.voix] !== v.voix[i - 1]![note.voix]);
      for (const l of note.lignes) notes.push(`<line class="ligne" x1="${x - 11}" x2="${x + 11}" y1="${y0 + l}" y2="${y0 + l}"/>`);
      if (note.alteration !== 0)
        notes.push(`<text class="alt${bouge ? ' bouge' : ''}" x="${x - 17}" y="${y0 + note.y + 5}" text-anchor="middle">${ALTERATION[note.alteration + 2]}</text>`);
      notes.push(`<path class="ronde${bouge ? ' bouge' : ''}" d="${RONDE}" transform="translate(${x} ${y0 + note.y})"/>`);
      const avant = placees[i - 1]?.[note.voix];
      if (avant && ligneDe(i - 1) === ligneDe(i))
        fils.push(`<line class="fil${note.voix === 0 ? ' fil-basse' : ''}" x1="${cx(i - 1) + 9}" y1="${y0 + avant.y}" x2="${cx(i) - 9}" y2="${y0 + note.y}"/>`);
    }
  });

  const hauteur = systemes * HAUTEUR_SYSTEME;
  const label = `Portée : ${v.noms.join(', ')}`;
  return `<svg viewBox="0 0 ${v.largeur} ${hauteur}" width="${v.largeur}" height="${hauteur}" role="img" aria-label="${escapeHtml(label)}">${fonds.join('')}${traits.join('')}${fils.join('')}${notes.join('')}</svg>`;
}
