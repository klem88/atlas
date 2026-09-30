/**
 * Estimation de tonalité depuis une suite d'accords (Chordonomicon n'en donne pas).
 *
 * Idée : une tonalité majeure a sept accords « chez elle » (I, ii, iii, IV, V, vi, vii°). On essaie les douze
 * armures, on pèse chaque accord par sa durée et par son accord avec la gamme, puis on ajoute ce qui désigne
 * la tonique : le premier accord du morceau, le dernier, le premier de chaque section, et le poids total des
 * accords de tonique (I majeur ou vi mineur). Le mode (majeur, ou son relatif mineur) se décide ensuite.
 * Les poids ont été ajustés sur les corpus annotés (iRb, Billboard) ; la précision est publiée par le pipeline.
 */
import type { Chord, TriadClass } from './chords';
import { triadClass } from './chords';

export interface WeightedChord {
  chord: Chord;
  weight: number;
  /** Premier accord d'une section (intro, couplet, refrain, A, B…). */
  sectionStart?: boolean;
}

export interface KeyEstimate {
  /** Classe de hauteur de la tonique, dans le mode retenu (la mineur → 9). */
  tonic: number;
  mode: 'major' | 'minor';
  /** Écart relatif entre la meilleure armure et la deuxième (0 = indécis, 1 = sans rivale). */
  margin: number;
}

/** Poids des indices de tonique, en part du poids total du morceau. */
export interface KeyParams {
  first: number;
  last: number;
  sectionStart: number;
  /** Multiplie le poids des accords de tonique (I majeur, vi mineur) en plus de leur accord avec la gamme. */
  tonic: number;
  /** Crédit des emprunts bVII et bVI majeurs, iv mineur. */
  borrowed: number;
  /** Cadence : un V majeur suivi de la tonique (I ou vi) ajoute ce multiple du poids de l'accord d'arrivée. */
  cadence: number;
}

export const DEFAULT_KEY_PARAMS: KeyParams = { first: 0.05, last: 0.05, sectionStart: 0.03, tonic: 0.25, borrowed: 0.3, cadence: 0.5 };

/** Accords de poids égal (quand on n'a pas les durées), les `null` écartés. */
export function weightedChords(chords: readonly (Chord | null)[]): WeightedChord[] {
  return chords.filter((c): c is Chord => c !== null).map((chord) => ({ chord, weight: 1 }));
}

/** Tonique du relatif majeur : la tonalité « d'armure », qui sert à comparer les progressions. */
export const relativeMajor = (k: KeyEstimate) => (k.mode === 'major' ? k.tonic : (k.tonic + 3) % 12);

/** Classe de triade attendue sur chaque degré de la gamme majeure. */
const DIATONIC: ReadonlyMap<number, TriadClass> = new Map([
  [0, 'maj'],
  [2, 'min'],
  [4, 'min'],
  [5, 'maj'],
  [7, 'maj'],
  [9, 'min'],
  [11, 'dim'],
]);

function fit(step: number, cls: TriadClass, borrowed: number): number {
  const expected = DIATONIC.get(step);
  if (expected) {
    if (cls === expected) return 1;
    if (cls === 'sus' || cls === 'other') return 0.7;
    // V du relatif mineur (III majeur), dominantes secondaires : la fondamentale est dans la gamme.
    return step === 4 && cls === 'maj' ? 0.6 : 0.35;
  }
  if (step === 10 && cls === 'maj') return borrowed;
  if (step === 8 && cls === 'maj') return borrowed * 0.7;
  if (step === 5 && cls === 'min') return borrowed * 0.7;
  return 0;
}

const stepOf = (root: number, t: number) => (((root - t) % 12) + 12) % 12;
const isTonicChord = (step: number, cls: TriadClass) => (step === 0 && cls === 'maj') || (step === 9 && cls === 'min');

/** Score de chacune des douze armures (tonique du relatif majeur). */
export function scoreKeys(chords: readonly WeightedChord[], p: KeyParams = DEFAULT_KEY_PARAMS): number[] {
  const total = chords.reduce((a, c) => a + c.weight, 0);
  const first = chords[0];
  const last = chords[chords.length - 1];
  const scores = new Array<number>(12).fill(0);
  for (let t = 0; t < 12; t++) {
    let s = 0;
    let prevStep = -1;
    let prevCls: TriadClass = 'other';
    for (const c of chords) {
      const step = stepOf(c.chord.root, t);
      const cls = triadClass(c.chord.quality);
      s += c.weight * fit(step, cls, p.borrowed);
      if (isTonicChord(step, cls)) {
        s += p.tonic * c.weight;
        if (c.sectionStart) s += p.sectionStart * total;
        if (prevStep === 7 && prevCls === 'maj') s += p.cadence * c.weight;
      }
      prevStep = step;
      prevCls = cls;
    }
    if (first && isTonicChord(stepOf(first.chord.root, t), triadClass(first.chord.quality))) s += p.first * total;
    if (last && isTonicChord(stepOf(last.chord.root, t), triadClass(last.chord.quality))) s += p.last * total;
    scores[t] = s;
  }
  return scores;
}

export function estimateKey(chords: readonly WeightedChord[], p: KeyParams = DEFAULT_KEY_PARAMS): KeyEstimate | null {
  if (chords.length === 0) return null;
  const scores = scoreKeys(chords, p);
  let best = 0;
  for (let t = 1; t < 12; t++) if (scores[t]! > scores[best]!) best = t;
  const second = Math.max(...scores.filter((_, i) => i !== best));
  const margin = scores[best]! > 0 ? (scores[best]! - second) / scores[best]! : 0;

  // Majeur ou relatif mineur ? Les mêmes indices, comparés entre I majeur et vi mineur.
  const total = chords.reduce((a, c) => a + c.weight, 0);
  let major = 0;
  let minor = 0;
  for (const c of chords) {
    const step = stepOf(c.chord.root, best);
    const cls = triadClass(c.chord.quality);
    const bonus = c.weight + (c.sectionStart ? p.sectionStart * total : 0);
    if (step === 0 && cls === 'maj') major += bonus;
    if (step === 9 && cls === 'min') minor += bonus;
    if (step === 4 && cls === 'maj') minor += c.weight; // dominante du mineur
    if (step === 7 && cls === 'maj') major += 0.5 * c.weight;
  }
  for (const [edge, w] of [
    [chords[0]!, p.first],
    [chords[chords.length - 1]!, p.last],
  ] as const) {
    const step = stepOf(edge.chord.root, best);
    const cls = triadClass(edge.chord.quality);
    if (step === 0 && cls === 'maj') major += w * total;
    if (step === 9 && cls === 'min') minor += w * total;
  }
  return minor > major ? { tonic: (best + 9) % 12, mode: 'minor', margin } : { tonic: best, mode: 'major', margin };
}
