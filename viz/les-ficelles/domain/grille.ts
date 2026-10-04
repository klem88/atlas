/**
 * La grille : la progression en accords symboliques (fondamentale, couleur, basse), chacun lu dans sa tonalité.
 * C'est la source de vérité de la page : les ficelles la transforment, la réalisation en tire les voix. Tout est pur.
 */
import { parseChord, type Quality } from '@shell/music/chords';

export type Couleur = 'maj' | 'min' | 'dim' | '7' | '7M' | 'm7';

export interface Accord {
  /** Classe de hauteur de la fondamentale (0 = do). */
  root: number;
  couleur: Couleur;
  /** La basse quand ce n'est pas la fondamentale (« Do/Si », « Fa/Sol »). */
  bass?: number;
  /** La tonique (majeure) dans laquelle l'accord se lit. */
  key: number;
  /**
   * La lettre de la fondamentale (0 = do … 6 = si), seulement quand ce n'est pas celle que donne la tonalité : Do♯ tapé
   * en Do (et non Ré♭), Do♯7 qui annonce Fa♯7. Absente, la fondamentale se lit dans la tonalité.
   */
  lettre?: number;
}

export type Grille = readonly Accord[];

export const mod12 = (n: number) => ((n % 12) + 12) % 12;
const mod7 = (n: number) => ((n % 7) + 7) % 7;

/** Les classes de hauteur des notes naturelles, de do à si. */
export const NATURELS: readonly number[] = [0, 2, 4, 5, 7, 9, 11];
/**
 * Écart (0 à 11) → degré de la gamme et altération. Sert pour la tonique d'une tonalité (lue depuis do : ré♭, mi♭, fa♯,
 * la♭, si♭ comme les noms de tonalité du site) et pour un accord dans une tonalité (♭II, ♭III, ♯IV, ♭VI, ♭VII).
 */
const ECRITURE: readonly (readonly [number, number])[] = [
  [0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [3, 1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0],
];

/** L'altération d'une classe de hauteur écrite sur une lettre, de −5 à 6 (sol♯ : 1 sur sol ; la♭ : −1 sur la). */
export function alterationSur(pc: number, lettre: number): number {
  const m = mod12(pc - NATURELS[mod7(lettre)]!);
  return m > 6 ? m - 12 : m;
}

/** La lettre d'une classe de hauteur lue dans une tonalité majeure (♭ pour les degrés abaissés, ♯ pour le IV haussé). */
export const lettreDansLaTonalite = (pc: number, key: number): number =>
  (ECRITURE[mod12(key)]![0] + ECRITURE[mod12(pc - key)]![0]) % 7;

/** La lettre de la fondamentale : celle qu'on a fixée, sinon celle de la tonalité. */
export const lettreDe = (a: Accord): number => a.lettre ?? lettreDansLaTonalite(a.root, a.key);

/**
 * Le même accord, sa fondamentale écrite sur cette lettre. La lettre n'est gardée que si la tonalité en donne une autre,
 * et seulement avec un dièse ou un bémol au plus : au-delà (fa𝄪 au bout d'une chaîne de dominantes), on revient à la
 * lettre de la tonalité, pour que toutes les notes de l'accord restent écrivables.
 */
export function avecLettre(a: Accord, lettre: number): Accord {
  const l = mod7(lettre);
  const base: Accord = { root: a.root, couleur: a.couleur, key: a.key };
  const s = a.bass === undefined ? base : { ...base, bass: a.bass };
  return l === lettreDansLaTonalite(a.root, a.key) || Math.abs(alterationSur(a.root, l)) > 1 ? s : { ...s, lettre: l };
}

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

/** Le même accord sur une autre basse (sans basse écrite si c'est la fondamentale) ; la lettre de la fondamentale reste. */
export function avecBasse(a: Accord, basse: number): Accord {
  const b = mod12(basse);
  const base: Accord = { root: a.root, couleur: a.couleur, key: a.key };
  const sans = a.lettre === undefined ? base : { ...base, lettre: a.lettre };
  return b === a.root ? sans : { ...sans, bass: b };
}

/**
 * Transpose de `n` demi-tons, la fondamentale avancée de `lettres` lettres. Par défaut, autant de lettres qu'entre les
 * deux toniques telles que le site les écrit (de Do à Fa♯ : trois) ; la montée d'un ton en impose une seule.
 */
export function transposer(a: Accord, n: number, lettres?: number): Accord {
  const key = mod12(a.key + n);
  const decalage = lettres ?? lettreDansLaTonalite(key, 0) - lettreDansLaTonalite(a.key, 0);
  const t: Accord = { root: mod12(a.root + n), couleur: a.couleur, key };
  return avecLettre(a.bass === undefined ? t : { ...t, bass: mod12(a.bass + n) }, lettreDe(a) + decalage);
}

/** La septième de dominante d'un accord, dans sa tonalité : une quinte au-dessus, quatre lettres plus loin (Do♯7 avant Fa♯). */
export const dominanteDe = (a: Accord): Accord =>
  avecLettre({ root: mod12(a.root + 7), couleur: '7', key: a.key }, lettreDe(a) + 4);

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

/** Même accord, écrit pareil : fondamentale (et sa lettre), couleur, basse. */
export const egaux = (a: Accord, b: Accord) =>
  a.root === b.root && lettreDe(a) === lettreDe(b) && a.couleur === b.couleur && basseDe(a) === basseDe(b);

/** Le cliché de départ, dans n'importe quelle tonalité : I – vi – IV – V. */
export const cliche = (key: number): Accord[] => ['I', 'vi', 'IV', 'V'].map((l) => accordDuDegre(l, key));

export const MIN_DEPART = 2;
export const MAX_DEPART = 8;

const LETTRES_EN = 'CDEFGAB';
const FR_EN: Readonly<Record<string, string>> = { do: 'C', ré: 'D', re: 'D', mi: 'E', fa: 'F', sol: 'G', la: 'A', si: 'B' };
const NOM_FR = /(^|\/)(do|ré|re|mi|fa|sol|la|si)/gi;
const COULEUR_DE: Partial<Record<Quality, Couleur>> = { maj: 'maj', min: 'min', dim: 'dim', dom7: '7', maj7: '7M', min7: 'm7' };

/** Lit « Lam », « La m », « Fa7M », « Do/Si », « Si♭ », « Do♯ m », ou l'écriture anglaise (« Am », « Fmaj7 », « C/B »). */
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
  // La lettre tapée (Do♯ et non Ré♭) : gardée quand la tonalité en donnerait une autre.
  const a = avecLettre({ root: c.root, couleur, key: mod12(key) }, LETTRES_EN.indexOf(t.charAt(0)));
  return c.bass === undefined ? a : avecBasse(a, c.bass);
}

const SUFFIXE_EN: Readonly<Record<Couleur, string>> = { maj: '', min: 'm', dim: 'dim', '7': '7', '7M': 'maj7', m7: 'm7' };

/** Une note en anglais sur une lettre, altérations en ASCII : « C# », « Db », « Fbb ». */
function noteEn(pc: number, lettre: number): string {
  const alt = alterationSur(pc, lettre);
  return `${LETTRES_EN[lettre]}${alt > 0 ? '#'.repeat(alt) : 'b'.repeat(-alt)}`;
}

/** Le symbole anglais, pour l'URL : « Am », « Fmaj7 », « C/B », « C#m » (la fondamentale sur sa lettre). */
export const symbole = (a: Accord): string =>
  `${noteEn(a.root, lettreDe(a))}${SUFFIXE_EN[a.couleur]}${a.bass === undefined ? '' : `/${noteEn(a.bass, lettreDansLaTonalite(a.bass, a.key))}`}`;

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
