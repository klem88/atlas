/**
 * Accordages : comment on place les notes d'un accord les unes par rapport aux autres.
 *
 * - `egal` : le tempérament égal du piano, douze demi-tons identiques de 2^(1/12).
 * - `pur` : l'intonation juste (à 5 limites), rapports simples de fréquences (3/2, 5/4…).
 * - `pythagore` : l'échelle des quintes pures, seuls 2 et 3 interviennent (81/64 pour la tierce).
 *
 * Le rapport « pur » sert aussi de référence : c'est de lui que l'on mesure l'écart en cents,
 * et ce sont ses harmoniques coïncidentes qui battent.
 */
import { equalFrequency } from './pitch';

export type TuningId = 'egal' | 'pur' | 'pythagore';

export interface Tuning {
  id: TuningId;
  label: string;
  /** Rapports [numérateur, dénominateur] des douze intervalles, de l'unisson à la septième majeure. */
  ratios: readonly (readonly [number, number])[] | null;
}

export const TUNINGS: readonly Tuning[] = [
  { id: 'egal', label: 'Ton piano (tempérament égal)', ratios: null },
  {
    id: 'pur',
    label: 'Pur (intonation juste)',
    ratios: [
      [1, 1],
      [16, 15],
      [9, 8],
      [6, 5],
      [5, 4],
      [4, 3],
      [45, 32],
      [3, 2],
      [8, 5],
      [5, 3],
      [9, 5],
      [15, 8],
    ],
  },
  {
    id: 'pythagore',
    label: 'Pythagore (quintes pures)',
    ratios: [
      [1, 1],
      [256, 243],
      [9, 8],
      [32, 27],
      [81, 64],
      [4, 3],
      [729, 512],
      [3, 2],
      [128, 81],
      [27, 16],
      [16, 9],
      [243, 128],
    ],
  },
];

const byId = Object.fromEntries(TUNINGS.map((t) => [t.id, t])) as Record<TuningId, Tuning>;

function pgcd(a: number, b: number): number {
  return b === 0 ? a : pgcd(b, a % b);
}

/** Rapport pur (intonation juste) d'un intervalle en demi-tons, réduit, octaves comprises. */
export function justRatio(st: number): [number, number] {
  const octaves = Math.floor(st / 12);
  const [n, d] = byId.pur.ratios![st % 12]!;
  const num = n * 2 ** octaves;
  const g = pgcd(num, d);
  return [num / g, d / g];
}

/** Rapport de fréquences d'un intervalle dans un accordage donné. */
export function tuningRatio(tuning: TuningId, st: number): number {
  const ratios = byId[tuning].ratios;
  if (!ratios) return 2 ** (st / 12);
  const [n, d] = ratios[st % 12]!;
  return (n / d) * 2 ** Math.floor(st / 12);
}

/** Un rapport de fréquences en cents (1200 par octave). */
export const ratioCents = (ratio: number) => 1200 * Math.log2(ratio);

/** Écart, en cents, d'un intervalle dans un accordage par rapport à son intervalle pur. Positif : plus large. */
export function cents(tuning: TuningId, st: number): number {
  const [n, d] = justRatio(st);
  return ratioCents(tuningRatio(tuning, st) / (n / d));
}

/**
 * Fréquences des notes d'un accord. La note la plus grave garde sa fréquence tempérée ;
 * les autres en dérivent par le rapport de l'accordage, dans l'ordre donné.
 */
export function chordFrequencies(midis: readonly number[], tuning: TuningId, a4?: number): number[] {
  if (midis.length === 0) return [];
  const root = Math.min(...midis);
  const rootHz = equalFrequency(root, a4);
  return midis.map((m) => rootHz * tuningRatio(tuning, m - root));
}

export const tuningLabel = (id: TuningId) => byId[id].label;
