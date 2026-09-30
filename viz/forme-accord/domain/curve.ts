/**
 * La courbe d'un accord : chaque note fournit un axe (x, y, z), sa valeur au temps t est le sinus de sa phase.
 * Le temps est compté en périodes de la note la plus grave. Avec des rapports entiers a:b:c (accord pur),
 * la courbe se referme au bout de `a` tours de la grave ; sinon elle ne se referme jamais et précesse.
 */
import { chordFrequencies, justRatio, type TuningId } from '@shell/music/tuning';

function pgcd(a: number, b: number): number {
  return b === 0 ? a : pgcd(b, a % b);
}
const ppcm = (a: number, b: number) => (a * b) / pgcd(a, b);

/** Fréquences relatives à la note la plus grave (1 pour elle), dans l'ordre croissant des notes. */
export function relativeRatios(midis: readonly number[], tuning: TuningId): number[] {
  const sorted = [...new Set(midis)].sort((a, b) => a - b);
  const f = chordFrequencies(sorted, tuning);
  return f.map((x) => x / f[0]!);
}

/** Rapports entiers de l'accord pur : 4:5:6 pour do–mi–sol. Le premier entier est le nombre de tours de la grave avant fermeture. */
export function integerRatios(midis: readonly number[]): number[] {
  const sorted = [...new Set(midis)].sort((a, b) => a - b);
  const fractions = sorted.map((m) => justRatio(m - sorted[0]!));
  const den = fractions.reduce((acc, [, d]) => ppcm(acc, d), 1);
  const ints = fractions.map(([n, d]) => (n * den) / d);
  const g = ints.reduce((acc, v) => pgcd(acc, v), ints[0] ?? 1);
  return ints.map((v) => v / g);
}

/** Tours de la note grave avant que la courbe pure se referme. */
export const closureTurns = (midis: readonly number[]) => integerRatios(midis)[0] ?? 1;

/**
 * Précession de chaque note : cycles gagnés (ou perdus) par tour de la grave, par rapport à l'accord pur.
 * Nul pour la grave et pour tout accord pur. La courbe fait un tour sur elle-même tous les 1/|p| tours.
 */
export function precession(midis: readonly number[], tuning: TuningId): number[] {
  const actual = relativeRatios(midis, tuning);
  const pure = relativeRatios(midis, 'pur');
  return actual.map((r, i) => {
    const d = r - pure[i]!;
    return Math.abs(d) < 1e-12 ? 0 : d;
  });
}

/**
 * Points (x, y, z) de la courbe entre t0 et t0 + duration (en tours de la grave), `samples` segments.
 * Deux notes : z vaut 0.
 */
export function curvePoints(ratios: readonly number[], t0: number, duration: number, samples: number): Float32Array<ArrayBuffer> {
  const out = new Float32Array((samples + 1) * 3);
  const [rx = 1, ry = 0, rz = 0] = ratios;
  for (let i = 0; i <= samples; i++) {
    const t = t0 + (i / samples) * duration;
    out[i * 3] = Math.sin(2 * Math.PI * rx * t);
    out[i * 3 + 1] = ry ? Math.sin(2 * Math.PI * ry * t) : 0;
    out[i * 3 + 2] = rz ? Math.sin(2 * Math.PI * rz * t) : 0;
  }
  return out;
}
