/**
 * La série harmonique d'une note : les rangs 1 à N, leur fréquence, la touche de piano la plus proche
 * et l'écart en cents. Tout dérive de la fondamentale ; rien n'est mesuré, tout est calculé.
 */
import { A4_HZ, A4_MIDI, equalFrequency, intervalName } from '@shell/music/pitch';

export const MAX_RANK = 16;
/** Au-delà de cet écart, on considère que l'harmonique tombe « entre les touches ». */
export const ON_KEY_CENTS = 15;

export interface Partial {
  /** Rang : 1 = la fondamentale. */
  k: number;
  hz: number;
  /** Touche la plus proche (MIDI). */
  midi: number;
  /** Écart à cette touche, en cents (positif : plus haut que la touche). */
  cents: number;
  /** Tombe sur une touche (|cents| ≤ 15). */
  onKey: boolean;
  /** Intervalle par rapport à la fondamentale, ramené dans l'octave (« quinte », « tierce majeure »…). */
  interval: string;
}

/** Note MIDI (fractionnaire) d'une fréquence. */
export const midiOf = (hz: number, a4 = A4_HZ) => A4_MIDI + 12 * Math.log2(hz / a4);

/** Les N premiers rangs de la série harmonique d'une note. */
export function harmonicSeries(fundamentalMidi: number, n = MAX_RANK): Partial[] {
  const f0 = equalFrequency(fundamentalMidi);
  const out: Partial[] = [];
  for (let k = 1; k <= n; k++) {
    const hz = f0 * k;
    const exact = midiOf(hz);
    const midi = Math.round(exact);
    const cents = Math.round((exact - midi) * 100 * 10) / 10;
    const semis = midi - fundamentalMidi;
    out.push({ k, hz, midi, cents, onKey: Math.abs(cents) <= ON_KEY_CENTS, interval: intervalName(semis % 12 === 0 && semis > 0 ? 12 : semis % 12) });
  }
  return out;
}

/** Amplitude d'un rang allumé : 1/k. */
export const amplitudeOf = (k: number) => 1 / k;

/** Somme des rangs allumés au temps t (en périodes de la fondamentale), amplitudes en 1/k. */
export function sumWave(ranks: readonly number[], t: number): number {
  let v = 0;
  for (const k of ranks) v += amplitudeOf(k) * Math.sin(2 * Math.PI * k * t);
  return v;
}

export interface Summary {
  onKey: number;
  offKey: number;
  /** Le rang le plus loin d'une touche, parmi les rangs demandés. */
  worst: Partial | null;
}

export function summarize(partials: readonly Partial[]): Summary {
  let worst: Partial | null = null;
  for (const p of partials) if (!worst || Math.abs(p.cents) > Math.abs(worst.cents)) worst = p;
  return { onKey: partials.filter((p) => p.onKey).length, offKey: partials.filter((p) => !p.onKey).length, worst };
}

/** Rangs valides, triés, sans doublon. */
export function normalizeRanks(ranks: readonly number[]): number[] {
  return [...new Set(ranks.filter((k) => Number.isInteger(k) && k >= 1 && k <= MAX_RANK))].sort((a, b) => a - b);
}
