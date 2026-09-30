/**
 * Battements : quand deux notes forment un intervalle presque pur, deux de leurs harmoniques
 * sont presque à la même fréquence. Leur somme gonfle et se creuse à la différence des deux
 * fréquences : c'est ce qu'on entend (et ce qu'on voit) sur un piano.
 */
import { semitones } from './pitch';
import { cents, chordFrequencies, justRatio, type TuningId } from './tuning';

export interface PairBeats {
  /** Notes MIDI, la plus grave d'abord. */
  low: number;
  high: number;
  semitones: number;
  /** Rangs des harmoniques qui devraient coïncider : [rang sur la grave, rang sur l'aiguë]. */
  harmonics: [number, number];
  /** Fréquences de ces deux harmoniques (Hz). */
  lowHz: number;
  highHz: number;
  /** Battements par seconde : |lowHz − highHz|. */
  beatHz: number;
  /** Écart de l'intervalle à l'intervalle pur (cents), positif si plus large. */
  cents: number;
}

/** Battements entre deux notes dans un accordage. */
export function pairBeats(a: number, b: number, tuning: TuningId): PairBeats {
  const low = Math.min(a, b);
  const high = Math.max(a, b);
  const st = semitones(low, high);
  const [n, d] = justRatio(st);
  const [fLow, fHigh] = chordFrequencies([low, high], tuning) as [number, number];
  const lowHz = n * fLow;
  const highHz = d * fHigh;
  return { low, high, semitones: st, harmonics: [n, d], lowHz, highHz, beatHz: Math.abs(lowHz - highHz), cents: cents(tuning, st) };
}

/**
 * Toutes les paires d'un accord, dans l'accordage donné. Dans l'intonation juste, chaque note est
 * accordée sur la plus grave : les paires qui ne la contiennent pas peuvent encore battre un peu.
 */
export function chordPairs(midis: readonly number[], tuning: TuningId): PairBeats[] {
  const sorted = [...new Set(midis)].sort((x, y) => x - y);
  const freqs = chordFrequencies(sorted, tuning);
  const pairs: PairBeats[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const st = sorted[j]! - sorted[i]!;
      const [n, d] = justRatio(st);
      const lowHz = n * freqs[i]!;
      const highHz = d * freqs[j]!;
      pairs.push({
        low: sorted[i]!,
        high: sorted[j]!,
        semitones: st,
        harmonics: [n, d],
        lowHz,
        highHz,
        beatHz: Math.abs(lowHz - highHz),
        cents: 1200 * Math.log2(freqs[j]! / freqs[i]! / (n / d)),
      });
    }
  }
  return pairs;
}

/** Durée (s) à afficher pour voir environ 2,5 battements, entre 0,05 et 4 secondes. */
export function beatWindow(beatHz: number): number {
  if (beatHz <= 0) return 4;
  return Math.min(4, Math.max(0.05, 2.5 / beatHz));
}

/** Amplitude de la somme de deux ondes d'amplitude 1 dont les fréquences diffèrent de `deltaHz`, à l'instant t. */
export function beatEnvelope(deltaHz: number, t: number): number {
  return 2 * Math.abs(Math.cos(Math.PI * deltaHz * t));
}
