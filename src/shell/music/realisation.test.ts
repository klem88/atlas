import { describe, expect, it } from 'vitest';
import { BASSE_MAX, BASSE_MIN, ECART_MAIN, HAUT_MAX, HAUT_MIN, bougent, paralleles, realiser, type AccordARealiser, type Voix } from './realisation';

const M = (r: number, basse = r): AccordARealiser => ({ notes: [r, (r + 4) % 12, (r + 7) % 12], basse });
const m = (r: number, basse = r): AccordARealiser => ({ notes: [r, (r + 3) % 12, (r + 7) % 12], basse });
const D7 = (r: number): AccordARealiser => ({ notes: [r, (r + 4) % 12, (r + 7) % 12, (r + 10) % 12], basse: r });
const pc = (n: number) => ((n % 12) + 12) % 12;

const PROGRESSIONS: AccordARealiser[][] = [
  [M(0), m(9), M(5), M(7), M(0)],
  [M(0), M(0, 11), m(9), m(9, 7), M(5), m(5), M(5, 7), M(0)],
  [M(0), D7(4), m(9), D7(0), M(5), D7(2), M(7), M(0)],
  [M(0), M(5), M(7), D7(9), M(2), m(11), M(7), M(9)],
];

describe('realiser', () => {
  it('part de la position de do quand l\'accord est do', () => {
    expect(realiser([M(0)])).toEqual([[48, 60, 64, 67]]);
  });

  it('tient les notes communes et bouge le moins possible', () => {
    const [, am] = realiser([M(0), m(9)]);
    expect(am).toEqual([45, 60, 64, 69]);
  });

  it('impose la basse, même étrangère à l\'accord', () => {
    const v = realiser([M(0), M(5, 7)]); // Do, Fa/Sol
    expect(pc(v[1]![0])).toBe(7);
    expect(v[1]!.slice(1).map(pc).sort((a, b) => a - b)).toEqual([0, 5, 9]);
  });

  it('garde tierce et septième d\'un accord de septième', () => {
    const [, g7] = realiser([M(0), D7(7)]);
    const haut = g7!.slice(1).map(pc);
    expect(haut).toContain(11);
    expect(haut).toContain(5);
  });

  it('respecte tessitures, ordre des voix et main', () => {
    for (const p of PROGRESSIONS)
      for (const v of realiser(p)) {
        expect(v[0]).toBeGreaterThanOrEqual(BASSE_MIN);
        expect(v[0]).toBeLessThanOrEqual(BASSE_MAX);
        expect(v[1]).toBeGreaterThanOrEqual(HAUT_MIN);
        expect(v[3]).toBeLessThanOrEqual(HAUT_MAX);
        expect(v[0] < v[1] && v[1] < v[2] && v[2] < v[3]).toBe(true);
        expect(v[3] - v[1]).toBeLessThanOrEqual(ECART_MAIN);
      }
  });

  it('évite les quintes et octaves parallèles', () => {
    for (const p of PROGRESSIONS) {
      const v = realiser(p);
      for (let i = 1; i < v.length; i++) expect(paralleles(v[i - 1]!, v[i]!)).toEqual([]);
    }
  });

  it('est déterministe', () => {
    expect(realiser(PROGRESSIONS[2]!)).toEqual(realiser(PROGRESSIONS[2]!));
  });
});

describe('paralleles', () => {
  it('voit les quintes parallèles et pas les mouvements contraires', () => {
    const a: Voix = [41, 60, 65, 69];
    expect(paralleles(a, [43, 62, 67, 71])).toEqual([[0, 1], [0, 2]]);
    expect(paralleles(a, [43, 59, 62, 67])).toEqual([]);
  });
});

describe('bougent', () => {
  it('dit quelles voix changent de note', () => {
    expect(bougent([48, 60, 64, 67], [47, 60, 64, 67])).toEqual([true, false, false, false]);
  });
});
