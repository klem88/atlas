import { describe, expect, it } from 'vitest';
import { PYTHAGOREAN_COMMA_CENTS, SYNTONIC_COMMA_CENTS, fifthsSpiral } from './comma';

describe('virgules', () => {
  it('douze quintes pures dépassent sept octaves de 23,46 cents', () => {
    expect(PYTHAGOREAN_COMMA_CENTS).toBeCloseTo(23.46, 2);
  });
  it('quatre quintes pures dépassent la tierce pure (+ 2 octaves) de 21,51 cents', () => {
    expect(SYNTONIC_COMMA_CENTS).toBeCloseTo(21.506, 3);
  });
});

describe('spirale des quintes', () => {
  it('en quintes pures : treize points, le dernier à 23,46 cents du départ, sept tours plus haut', () => {
    const pts = fifthsSpiral('pythagore');
    expect(pts).toHaveLength(13);
    expect(pts[0]).toMatchObject({ step: 0, cents: 0, turns: 0, name: 'do' });
    expect(pts[12]!.cents).toBeCloseTo(7 * 1200 + 23.46, 2);
    expect(pts[12]!.turns).toBeCloseTo(7 + 23.46 / 1200, 4);
    expect(pts[1]!.name).toBe('sol');
    expect(pts[6]!.name).toBe('fa♯');
  });
  it('en quintes tempérées : la douzième retombe exactement sur le départ', () => {
    const pts = fifthsSpiral('egal');
    expect(pts[12]!.cents).toBeCloseTo(8400, 9);
    expect(pts[12]!.turns).toBeCloseTo(7, 9);
  });
});
