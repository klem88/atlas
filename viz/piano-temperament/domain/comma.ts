/**
 * Les virgules : ce qui reste quand on empile des intervalles purs qui « devraient » se refermer.
 * Douze quintes pures font un peu plus que sept octaves ; c'est la virgule pythagoricienne,
 * et tout accordage à douze notes doit la cacher quelque part.
 */
import { PITCH_NAMES, pitchClass } from './pitch';
import { ratioCents, tuningRatio, type TuningId } from './tuning';

/** 3^12 / 2^19, en cents : 23,46. */
export const PYTHAGOREAN_COMMA_CENTS = ratioCents(3 ** 12 / 2 ** 19);

/** 81/80, en cents : 21,51. Écart entre la tierce de quatre quintes pures et la tierce pure. */
export const SYNTONIC_COMMA_CENTS = ratioCents(81 / 80);

export interface SpiralPoint {
  /** Nombre de quintes empilées depuis le do. */
  step: number;
  /** Hauteur atteinte depuis le départ, en cents. */
  cents: number;
  /** Tours de spirale (1 tour = 1 octave). Partie fractionnaire = position sur le cercle. */
  turns: number;
  name: string;
}

/**
 * Treize points : do, puis douze quintes empilées. En quintes pures, le dernier ne retombe pas sur le do ;
 * en quintes tempérées, si.
 */
export function fifthsSpiral(tuning: TuningId): SpiralPoint[] {
  const fifth = ratioCents(tuningRatio(tuning, 7));
  return Array.from({ length: 13 }, (_, step) => {
    const cents = step * fifth;
    return { step, cents, turns: cents / 1200, name: PITCH_NAMES[pitchClass(step * 7)]! };
  });
}
