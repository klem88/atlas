/**
 * La grille : la progression en accords symboliques (fondamentale, couleur, basse), chacun lu dans sa tonalité.
 * C'est la source de vérité de la page : les ficelles la transforment, la réalisation en tire les voix. Tout est pur.
 */
import { parseChord, type Quality } from '@shell/music/chords';
import { KEY_NAMES } from '../../compose-ta-progression/state';

export type Couleur = 'maj' | 'min' | 'dim' | '7' | '7M' | 'm7';

export interface Accord {
  /** Classe de hauteur de la fondamentale (0 = do). */
  root: number;
  couleur: Couleur;
  /** La basse quand ce n'est pas la fondamentale (« Do/Si », « Fa/Sol »). */
  bass?: number;
  /** La tonique (majeure) dans laquelle l'accord se lit. */
  key: number;
}

export type Grille = readonly Accord[];

export const mod12 = (n: number) => ((n % 12) + 12) % 12;

export const INTERVALLES: Readonly<Record<Couleur, readonly number[]>> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
  '7': [0, 4, 7, 10],
  '7M': [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
};

/** Les classes de hauteur de l'accord : fondamentale, tierce, quinte (et septième). */
export const notesDe = (a: Accord): number[] => INTERVALLES[a.couleur].map((i) => mod12(a.root + i));
export const basseDe = (a: Accord): number => a.bass ?? a.root;
/** Écart de la fondamentale à la tonique, de 0 à 11. */
export const pas = (a: Accord): number => mod12(a.root - a.key);

/** Le même accord sur une autre basse (sans basse écrite si c'est la fondamentale). */
export function avecBasse(a: Accord, basse: number): Accord {
  const b = mod12(basse);
  const sans: Accord = { root: a.root, couleur: a.couleur, key: a.key };
  return b === a.root ? sans : { ...sans, bass: b };
}

export function transposer(a: Accord, n: number): Accord {
  const t: Accord = { root: mod12(a.root + n), couleur: a.couleur, key: mod12(a.key + n) };
  return a.bass === undefined ? t : { ...t, bass: mod12(a.bass + n) };
}

type Triade = 'maj' | 'min' | 'dim';
const DEGRES: ReadonlyMap<number, { label: string; triade: Triade }> = new Map([
  [0, { label: 'I', triade: 'maj' }],
  [2, { label: 'ii', triade: 'min' }],
  [4, { label: 'iii', triade: 'min' }],
  [5, { label: 'IV', triade: 'maj' }],
  [7, { label: 'V', triade: 'maj' }],
  [9, { label: 'vi', triade: 'min' }],
  [11, { label: 'vii°', triade: 'dim' }],
]);
export const LABELS = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'] as const;
const triadeDe = (c: Couleur): Triade => (c === 'min' || c === 'm7' ? 'min' : c === 'dim' ? 'dim' : 'maj');

/** Le degré de l'accord dans sa tonalité (« IV », « vi »), ou `null` hors de la gamme. Une septième compte avec sa triade (Sol7 est V). */
export function degre(a: Accord): string | null {
  const d = DEGRES.get(pas(a));
  return d && d.triade === triadeDe(a.couleur) ? d.label : null;
}

/** L'accord d'un degré de la gamme (« vi » en Do : La m). */
export function accordDuDegre(label: string, key: number): Accord {
  for (const [p, d] of DEGRES) if (d.label === label) return { root: mod12(key + p), couleur: d.triade, key: mod12(key) };
  throw new Error(`Degré inconnu : ${label}`);
}

export const egaux = (a: Accord, b: Accord) => a.root === b.root && a.couleur === b.couleur && basseDe(a) === basseDe(b);

/** Le cliché de départ, dans n'importe quelle tonalité : I – vi – IV – V. */
export const cliche = (key: number): Accord[] => ['I', 'vi', 'IV', 'V'].map((l) => accordDuDegre(l, key));

export const MIN_DEPART = 2;
export const MAX_DEPART = 8;

const FR_EN: Readonly<Record<string, string>> = { do: 'C', ré: 'D', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' };
const NOM_FR = /(^|\/)(do|ré|re|mi|fa|sol|la|si)/gi;
const COULEUR_DE: Partial<Record<Quality, Couleur>> = { maj: 'maj', min: 'min', dim: 'dim', dom7: '7', maj7: '7M', min7: 'm7' };

/** Lit « Lam », « La m », « Fa7M », « Do/Si », « Si♭ », ou l'écriture anglaise (« Am », « Fmaj7 », « C/B »). */
export function lireAccord(s: string, key: number): Accord | null {
  const t = s
    .trim()
    .replace(/\s+/g, '')
    .replace(NOM_FR, (_m: string, avant: string, nom: string) => avant + FR_EN[nom.toLowerCase()]!)
    .replace('7M', 'maj7');
  const c = parseChord(t);
  if (!c) return null;
  const couleur = COULEUR_DE[c.quality];
  if (!couleur) return null;
  const a: Accord = { root: c.root, couleur, key: mod12(key) };
  return c.bass === undefined ? a : avecBasse(a, c.bass);
}

const SUFFIXE_EN: Readonly<Record<Couleur, string>> = { maj: '', min: 'm', dim: 'dim', '7': '7', '7M': 'maj7', m7: 'm7' };

/** Le symbole anglais, pour l'URL : « Am », « Fmaj7 », « C/B ». */
export const symbole = (a: Accord): string =>
  `${KEY_NAMES[a.root]}${SUFFIXE_EN[a.couleur]}${a.bass === undefined ? '' : `/${KEY_NAMES[a.bass]}`}`;

/** Découpe une saisie (« Do La m Fa7M, Sol ») en accords : un suffixe isolé (« m », « m7 », « ° ») se recolle au nom d'avant. */
export function decouper(texte: string): string[] {
  const out: string[] = [];
  for (const t of texte.split(/[\s,;–—]+/)) {
    if (!t || t === '-') continue;
    if (out.length && /^(m|m7|7|7M|maj7|°|dim)$/.test(t)) out[out.length - 1] += t;
    else out.push(t);
  }
  return out;
}
