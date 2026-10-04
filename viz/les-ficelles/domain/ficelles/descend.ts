/**
 * La basse qui descend : entre deux accords dont la basse descend d'une tierce (ou d'une quarte), l'accord reste et la
 * basse passe par les notes de la gamme (Do – Do/Si – La m). La basse devient une mélodie.
 */
import { accordDuDegre, avecBasse, basseDe, mod12, type Grille } from '../grille';
import { ecrireDans, nomAccord, nomNote } from '../orthographe';
import { MAX_GRILLE, type Ficelle } from './type';

const GAMME = [0, 2, 4, 5, 7, 9, 11];

/** Les notes de la gamme strictement entre deux basses, en descendant (do → la : si). */
export function passages(haut: number, bas: number, key: number): number[] {
  const out: number[] = [];
  for (let d = 1; d < mod12(haut - bas); d++) {
    const n = mod12(haut - d);
    if (GAMME.includes(mod12(n - key))) out.push(n);
  }
  return out;
}

/** Les notes de passage d'un endroit, ou `null` s'il n'en est pas un. */
function chemin(g: Grille, i: number): number[] | null {
  const a = g[i];
  const b = g[i + 1];
  if (!a || !b || a.key !== b.key) return null;
  const ecart = mod12(basseDe(a) - basseDe(b));
  if (ecart < 3 || ecart > 5) return null;
  const p = passages(basseDe(a), basseDe(b), a.key);
  return p.length === (ecart === 5 ? 2 : 1) && g.length + p.length <= MAX_GRILLE ? p : null;
}

export const descend: Ficelle = {
  id: 'descend',
  nom: 'La basse qui descend',
  resume: 'L\'accord reste, la basse descend note à note jusqu\'au suivant.',
  endroits: (g) => g.flatMap((_, i) => (chemin(g, i) ? [i] : [])),
  zone: (_g, i) => [i, i + 1],
  appliquer(g, i) {
    const a = g[i]!;
    const ajout = chemin(g, i)!.map((n) => avecBasse(a, n));
    return { grille: [...g.slice(0, i + 1), ...ajout, ...g.slice(i + 1)], touches: ajout.map((_, k) => i + 1 + k) };
  },
  explique(g, i) {
    const a = g[i]!;
    const b = g[i + 1]!;
    const notes = [...[basseDe(a), ...chemin(g, i)!].map((n) => ecrireDans(n, a)), ecrireDans(basseDe(b), b)].map(nomNote);
    return `${nomAccord(a)} reste, la basse descend note à note : ${notes.join(', ')}, jusqu\'à ${nomAccord(b)}. La basse devient une mélodie.`;
  },
  pourquoiPas(g) {
    const k = g[0]?.key ?? 0;
    return `Il faut deux accords dont la basse descend d\'une tierce ou d\'une quarte (par exemple ${nomAccord(accordDuDegre('I', k))} puis ${nomAccord(accordDuDegre('vi', k))}).`;
  },
};
