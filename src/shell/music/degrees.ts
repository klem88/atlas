/**
 * Degrés : un accord vu depuis la tonique (I, ii, V, bVII…), en classe de triade (les septièmes repliées).
 * Un degré tient sur un octet (`degreeToken`), ce qui permet de compter des millions de suites.
 * Les suites (« progressions ») sont des listes de degrés ; leur forme texte sert dans l'URL.
 */
import { TRIAD_CLASSES, triadClass, type Chord, type TriadClass } from './chords';

export interface Degree {
  /** Demi-tons au-dessus de la tonique (0 = I … 11 = VII). */
  step: number;
  cls: TriadClass;
}

/** Épellation par rapport à la gamme majeure : bIII plutôt que #II, #IV plutôt que bV. */
export const STEP_NAMES = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII'] as const;

export function degreeOf(chord: Chord, tonic: number): Degree {
  return { step: (((chord.root - tonic) % 12) + 12) % 12, cls: triadClass(chord.quality) };
}

export const TOKEN_COUNT = 12 * TRIAD_CLASSES.length;
export const degreeToken = (d: Degree): number => d.step * TRIAD_CLASSES.length + TRIAD_CLASSES.indexOf(d.cls);
export const tokenToDegree = (t: number): Degree => ({
  step: Math.floor(t / TRIAD_CLASSES.length),
  cls: TRIAD_CLASSES[t % TRIAD_CLASSES.length]!,
});

const SUFFIX: Record<TriadClass, string> = { maj: '', min: '', dim: '°', aug: '+', sus: 'sus', other: '?' };

/** « I », « ii », « vii° », « bVII », « III+ », « Vsus ». Minuscules pour mineur et diminué. */
export function degreeLabel(d: Degree): string {
  const name = STEP_NAMES[d.step]!;
  const m = /^([#b]?)([IV]+)$/.exec(name)!;
  const numeral = d.cls === 'min' || d.cls === 'dim' ? m[2]!.toLowerCase() : m[2]!;
  return `${m[1]}${numeral}${SUFFIX[d.cls]}`;
}

const ROMAN: Record<string, number> = { I: 0, II: 2, III: 4, IV: 5, V: 7, VI: 9, VII: 11 };

/** Relit une étiquette ; tolère « ♭ », « o » pour °, et un « 7 » final (ignoré : la classe de triade suffit). */
export function parseDegreeLabel(raw: string): Degree | null {
  const s = raw.trim().replace('♭', 'b').replace('♯', '#');
  const m = /^([#b]?)(vii|vi|iv|v|iii|ii|i|VII|VI|IV|V|III|II|I)(°|o|ø|\+|sus|7|maj7|Δ|\?)?$/.exec(s);
  if (!m) return null;
  const numeral = m[2]!;
  const lower = numeral === numeral.toLowerCase();
  let step = ROMAN[numeral.toUpperCase()]!;
  if (m[1] === 'b') step -= 1;
  if (m[1] === '#') step += 1;
  step = ((step % 12) + 12) % 12;
  const suffix = m[3] ?? '';
  let cls: TriadClass;
  if (suffix === '°' || suffix === 'o' || suffix === 'ø') cls = 'dim';
  else if (suffix === '+') cls = 'aug';
  else if (suffix === 'sus') cls = 'sus';
  else if (suffix === '?') cls = 'other';
  else cls = lower ? 'min' : 'maj';
  return { step, cls };
}

/**
 * Suite des degrés d'une liste d'accords (les `null` sont ignorés), sans répétition immédiate :
 * « C C G Am Am F » donne I–V–vi–IV.
 */
export function tokensOf(chords: readonly (Chord | null)[], tonic: number): number[] {
  const out: number[] = [];
  for (const c of chords) {
    if (!c) continue;
    const t = degreeToken(degreeOf(c, tonic));
    if (out[out.length - 1] !== t) out.push(t);
  }
  return out;
}

export const MIN_LENGTH = 2;
export const MAX_LENGTH = 8;

/** « I,V,vi,IV » (URL), « I-V-vi-IV » ou « I–V–vi–IV » → degrés ; `null` si un jeton est illisible ou hors longueur. */
export function parseProgression(text: string): Degree[] | null {
  const parts = text
    .split(/[,–\-|>→\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < MIN_LENGTH || parts.length > MAX_LENGTH) return null;
  const degrees: Degree[] = [];
  for (const p of parts) {
    const d = parseDegreeLabel(p);
    if (!d) return null;
    degrees.push(d);
  }
  return degrees;
}

export const progressionLabel = (p: readonly Degree[]) => p.map(degreeLabel).join('–');
export const progressionKey = (p: readonly Degree[]) => p.map(degreeLabel).join(',');

/** Les autres rotations d'une boucle, sans doublon ni retour à la suite d'origine. */
export function rotations(p: readonly Degree[]): Degree[][] {
  const seen = new Set([progressionKey(p)]);
  const out: Degree[][] = [];
  for (let i = 1; i < p.length; i++) {
    const r = [...p.slice(i), ...p.slice(0, i)];
    const k = progressionKey(r);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}
