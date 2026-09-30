/**
 * Estimation de tonalité depuis une suite d'accords (Chordonomicon n'en donne pas).
 *
 * Idée : une tonalité majeure a sept accords « chez elle » (I, ii, iii, IV, V, vi, vii°). On essaie les douze,
 * on pèse chaque accord par sa durée et par son accord avec la gamme, on ajoute un bonus au premier et au dernier
 * accord (qui posent la tonique), et on garde la meilleure. Le mode (majeur, ou son relatif mineur) se décide
 * ensuite : le mineur gagne quand le vi domine, ouvre ou ferme, ou quand sa dominante (III majeur) est présente.
 * La précision est mesurée sur iRb et Billboard, où la tonalité est connue (voir le rapport du pipeline).
 */
import type { Chord, TriadClass } from './chords';
import { triadClass } from './chords';

export interface WeightedChord {
  chord: Chord;
  weight: number;
}

export interface KeyEstimate {
  /** Classe de hauteur de la tonique, dans le mode retenu (la mineur → 9). */
  tonic: number;
  mode: 'major' | 'minor';
  /** Écart relatif entre la meilleure armure et la deuxième (0 = indécis, 1 = sans rivale). */
  margin: number;
}

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

const EDGE_BONUS = 2;

function fit(step: number, cls: TriadClass): number {
  const expected = DIATONIC.get(step);
  if (expected) {
    if (cls === expected) return 1;
    if (cls === 'sus' || cls === 'other') return 0.7;
    // V du relatif mineur (III majeur), dominantes secondaires : la fondamentale est dans la gamme.
    return step === 4 && cls === 'maj' ? 0.6 : 0.35;
  }
  // Emprunts fréquents : bVII et bVI majeurs (rock, mineur mélodique), iv mineur.
  if (step === 10 && cls === 'maj') return 0.3;
  if (step === 8 && cls === 'maj') return 0.2;
  return 0;
}

export function estimateKey(chords: readonly WeightedChord[]): KeyEstimate | null {
  if (chords.length === 0) return null;
  const first = chords[0]!;
  const last = chords[chords.length - 1]!;

  const scores = new Array<number>(12).fill(0);
  for (let t = 0; t < 12; t++) {
    let s = 0;
    for (const { chord, weight } of chords) {
      const step = (((chord.root - t) % 12) + 12) % 12;
      s += weight * fit(step, triadClass(chord.quality));
    }
    for (const edge of [first, last]) {
      const step = (((edge.chord.root - t) % 12) + 12) % 12;
      const cls = triadClass(edge.chord.quality);
      if (step === 0 && cls === 'maj') s += EDGE_BONUS;
      if (step === 9 && cls === 'min') s += EDGE_BONUS;
    }
    scores[t] = s;
  }

  let best = 0;
  for (let t = 1; t < 12; t++) if (scores[t]! > scores[best]!) best = t;
  const second = Math.max(...scores.filter((_, i) => i !== best));
  const margin = scores[best]! > 0 ? (scores[best]! - second) / scores[best]! : 0;

  // Majeur ou relatif mineur ?
  let major = 0;
  let minor = 0;
  for (const { chord, weight } of chords) {
    const step = (((chord.root - best) % 12) + 12) % 12;
    const cls = triadClass(chord.quality);
    if (step === 0 && cls === 'maj') major += weight;
    if (step === 9 && cls === 'min') minor += weight;
    if (step === 4 && cls === 'maj') minor += weight; // dominante du mineur
    if (step === 7 && cls === 'maj') major += 0.5 * weight;
  }
  for (const edge of [first, last]) {
    const step = (((edge.chord.root - best) % 12) + 12) % 12;
    const cls = triadClass(edge.chord.quality);
    if (step === 0 && cls === 'maj') major += EDGE_BONUS;
    if (step === 9 && cls === 'min') minor += EDGE_BONUS;
  }
  return minor > major ? { tonic: (best + 9) % 12, mode: 'minor', margin } : { tonic: best, mode: 'major', margin };
}
