import { describe, expect, it } from 'vitest';
import { TUNINGS, cents, chordFrequencies, justRatio, ratioCents, tuningRatio } from './tuning';

describe('rapports', () => {
  it('quinte pure 3/2, tierce majeure pure 5/4, tierce pythagoricienne 81/64', () => {
    expect(justRatio(7)).toEqual([3, 2]);
    expect(justRatio(4)).toEqual([5, 4]);
    expect(tuningRatio('pythagore', 4)).toBeCloseTo(81 / 64, 12);
    expect(tuningRatio('pur', 4)).toBeCloseTo(5 / 4, 12);
    expect(tuningRatio('egal', 7)).toBeCloseTo(2 ** (7 / 12), 12);
  });
  it('au-delà de l’octave, le rapport double par octave', () => {
    expect(justRatio(19)).toEqual([3, 1]);
    expect(justRatio(12)).toEqual([2, 1]);
    expect(justRatio(24)).toEqual([4, 1]);
    expect(tuningRatio('pur', 16)).toBeCloseTo(5 / 2, 12);
  });
});

describe('cents', () => {
  it('1200 cents par octave, 100 par demi-ton tempéré', () => {
    expect(ratioCents(2)).toBeCloseTo(1200, 9);
    expect(ratioCents(2 ** (7 / 12))).toBeCloseTo(700, 9);
  });
  it('la quinte pure fait 701,955 cents, la tierce majeure pure 386,31', () => {
    expect(ratioCents(3 / 2)).toBeCloseTo(701.955, 3);
    expect(ratioCents(5 / 4)).toBeCloseTo(386.314, 3);
  });
  it('écart d’un intervalle tempéré à son intervalle pur', () => {
    expect(cents('egal', 7)).toBeCloseTo(-1.955, 3);
    expect(cents('egal', 4)).toBeCloseTo(13.686, 3);
    expect(cents('pur', 4)).toBeCloseTo(0, 9);
    expect(cents('pythagore', 4)).toBeCloseTo(21.506, 3);
    expect(cents('pythagore', 7)).toBeCloseTo(0, 9);
  });
});

describe('fréquences d’un accord', () => {
  it('tempéré : chaque note à sa fréquence de piano', () => {
    const f = chordFrequencies([60, 64, 67], 'egal');
    expect(f.map((x) => Math.round(x * 100) / 100)).toEqual([261.63, 329.63, 392]);
  });
  it('pur : rapports simples à partir de la note la plus grave, elle-même tempérée', () => {
    const f = chordFrequencies([67, 60, 64], 'pur');
    expect(f[1]).toBeCloseTo(261.6256, 3);
    expect(f[2]! / f[1]!).toBeCloseTo(5 / 4, 9);
    expect(f[0]! / f[1]!).toBeCloseTo(3 / 2, 9);
  });
  it('garde l’ordre des notes données', () => {
    expect(chordFrequencies([67, 60], 'egal')[0]).toBeCloseTo(392, 2);
  });
  it('une note seule ne change pas selon l’accordage', () => {
    for (const t of TUNINGS) expect(chordFrequencies([69], t.id)[0]).toBe(440);
  });
});
