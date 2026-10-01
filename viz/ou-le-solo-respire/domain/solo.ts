/**
 * Les notes d'un solo vues depuis l'accord : degré relatif (0 = fondamentale … 11 = septième majeure), répartitions,
 * note la plus jouée, note évitée, lecture de la grille textuelle de la Weimar Jazz Database. Pur.
 */
import type { Quality } from '@shell/music/chords';

/** Les douze degrés relatifs à l'accord, nommés comme les jazzmen les pensent. */
export const DEGREE_NAMES = ['1', '♭9', '9', '♯9', '3', '11', '♯11', '5', '♭13', '13', '♭7', '7'] as const;
/** Noms longs pour les phrases. */
export const DEGREE_LONG = ['la fondamentale', 'la neuvième mineure', 'la neuvième', 'la neuvième augmentée', 'la tierce', 'la onzième', 'la onzième augmentée', 'la quinte', 'la treizième mineure', 'la treizième', 'la septième mineure', 'la septième majeure'] as const;

export const relativeDegree = (pitch: number, root: number) => (((pitch - root) % 12) + 12) % 12;

/** Degrés « de l'accord » selon sa qualité : ceux qu'on attend ; les autres sont des tensions ou des notes de passage. */
export function chordTones(q: Quality): number[] {
  switch (q) {
    case 'maj':
      return [0, 4, 7];
    case 'maj7':
      return [0, 4, 7, 11];
    case 'dom7':
      return [0, 4, 7, 10];
    case 'min':
      return [0, 3, 7];
    case 'min7':
      return [0, 3, 7, 10];
    case 'dim':
      return [0, 3, 6, 9];
    case 'hdim':
      return [0, 3, 6, 10];
    case 'sus':
      return [0, 5, 7, 10];
    case 'aug':
      return [0, 4, 8];
    default:
      return [0, 7];
  }
}

/** Parts (somme 1) d'un tableau de comptes ; tout à zéro si vide. */
export function shares(counts: ArrayLike<number>): number[] {
  let total = 0;
  for (let i = 0; i < counts.length; i++) total += counts[i]!;
  return Array.from({ length: counts.length }, (_, i) => (total ? counts[i]! / total : 0));
}

export const sum = (a: ArrayLike<number>, b: ArrayLike<number>) => Array.from({ length: Math.max(a.length, b.length) }, (_, i) => (a[i] ?? 0) + (b[i] ?? 0));

export interface Reading {
  total: number;
  shares: number[];
  /** Degré le plus joué. */
  top: number;
  /** Les trois plus joués, décroissants. */
  top3: number[];
  /** Parmi les degrés attendus de l'accord (et 9, 11, 13 pour les septièmes), le moins joué. */
  avoided: number | null;
  /** Part des notes hors des degrés attendus. */
  outside: number;
}

export function read(counts: ArrayLike<number>, quality: Quality): Reading {
  const sh = shares(counts);
  let total = 0;
  for (let i = 0; i < counts.length; i++) total += counts[i]!;
  const order = sh.map((v, i) => i).sort((a, b) => sh[b]! - sh[a]!);
  const tones = chordTones(quality);
  const candidates = quality === 'maj' || quality === 'min' || quality === 'aug' ? tones : [...tones, 2, 5, 9].filter((d, i, arr) => arr.indexOf(d) === i);
  const avoided = total ? candidates.reduce<number | null>((best, d) => (best === null || sh[d]! < sh[best]! ? d : best), null) : null;
  const inside = tones.reduce((a, d) => a + sh[d]!, 0);
  return { total, shares: sh, top: order[0]!, top3: order.slice(0, 3), avoided, outside: Math.max(0, 1 - inside) };
}

/** « une fois sur six », « 18 % du temps »… */
export function onceEvery(share: number): string {
  if (share <= 0) return 'jamais';
  const k = Math.round(1 / share);
  if (k >= 2 && k <= 12 && Math.abs(1 / k - share) / share < 0.15) return `une fois sur ${['', '', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze'][k]}`;
  return `${Math.round(share * 100)} % du temps`;
}

/* La grille textuelle de Weimar : « A1: ||Bb6 G7 |C-7 F7 |Bb G-7 |…|| » ----------------------------------------- */

export interface GridBar {
  chords: string[];
}
export interface GridSection {
  name: string;
  bars: GridBar[];
}

export function parseChordChanges(text: string): GridSection[] {
  const out: GridSection[] = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^([^:|]+):\s*(.*)$/.exec(line);
    const name = m ? m[1]!.trim() : '';
    const body = (m ? m[2]! : line).replace(/\|\|/g, '|');
    const bars = body
      .split('|')
      .map((b) => b.trim())
      .filter((b) => b.length > 0)
      .map((b) => ({ chords: b.split(/\s+/).filter((c) => c && c !== 'NC' && c !== '%' && c !== '/') }))
      .filter((b) => b.chords.length > 0 || true);
    if (bars.length) out.push({ name, bars });
  }
  return out;
}

/** Normalise un symbole de Weimar vers celui des sections (« Bb6 » et « Bb6 » : identiques ; les variantes d'écriture sont rares). */
export const normalizeSymbol = (s: string) => s.trim();
