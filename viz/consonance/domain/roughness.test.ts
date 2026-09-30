import { describe, expect, it } from 'vitest';
import { SIMPLE_RATIOS, findValleys, nearestRatio, partials, roughness, roughnessCurve, roughnessPair } from './roughness';

describe('dissonance de deux partiels', () => {
  it('nulle à l’unisson, positive pour un petit écart, nulle loin', () => {
    expect(roughnessPair(440, 1, 440, 1)).toBeCloseTo(0, 9);
    expect(roughnessPair(440, 1, 460, 1)).toBeGreaterThan(0.1); // le maximum du modèle vaut 0,176
    expect(roughnessPair(440, 1, 2000, 1)).toBeLessThan(0.001);
  });
  it('maximale autour d’un quart de bande critique, proportionnelle aux amplitudes', () => {
    const near = roughnessPair(440, 1, 452, 1);
    const far = roughnessPair(440, 1, 520, 1);
    expect(near).toBeGreaterThan(far);
    expect(roughnessPair(440, 0.5, 452, 0.5)).toBeCloseTo(near * 0.25, 9);
  });
  it('symétrique', () => {
    expect(roughnessPair(300, 1, 330, 1)).toBeCloseTo(roughnessPair(330, 1, 300, 1), 12);
  });
});

describe('partiels et rugosité d’un intervalle', () => {
  it('n harmoniques d’amplitude décroissante', () => {
    const p = partials(100, 3);
    expect(p.map((x) => x.hz)).toEqual([100, 200, 300]);
    expect(p[0]!.amp).toBe(1);
    expect(p[1]!.amp).toBeLessThan(1);
  });
  it('avec des sinusoïdes pures, aucune vallée : une seule colline qui redescend', () => {
    const valleys = findValleys(roughnessCurve(261.6, 1)).filter((v) => v.cents > 0);
    expect(valleys).toEqual([]);
    expect(roughness(261.6, 2, 1)).toBeLessThan(roughness(261.6, 2 ** 0.5, 1));
  });
  it('avec six harmoniques, la quinte pure est bien plus douce que la seconde majeure, et le triton entre les deux', () => {
    const fifth = roughness(261.6, 1.5, 6);
    const second = roughness(261.6, 9 / 8, 6);
    const tritone = roughness(261.6, 45 / 32, 6);
    expect(fifth).toBeLessThan(tritone);
    expect(tritone).toBeLessThan(second);
  });
});

describe('courbe et vallées', () => {
  it('un point par cent, de 0 à un peu au-delà de l’octave', () => {
    const c = roughnessCurve(261.6, 6);
    expect(c).toHaveLength(1251);
    expect(c[0]!.cents).toBe(0);
    expect(c[1200]!.cents).toBe(1200);
  });
  it('les vallées d’un timbre à six harmoniques tombent sur l’octave, la quinte, la quarte, les sixtes et les tierces', () => {
    const valleys = findValleys(roughnessCurve(261.6, 6));
    const named = valleys.filter((v) => v.ratio).map((v) => v.ratio!.label);
    for (const label of ['octave', 'quinte', 'quarte', 'sixte majeure', 'tierce majeure', 'tierce mineure']) expect(named).toContain(label);
    const fifth = valleys.find((v) => v.ratio?.label === 'quinte')!;
    expect(Math.abs(fifth.cents - 701.96)).toBeLessThan(4);
  });
  it('rapport simple le plus proche d’une position en cents', () => {
    expect(nearestRatio(400)!.label).toBe('tierce majeure');
    expect(nearestRatio(386)!.cents).toBeCloseTo(386.31, 1);
    expect(nearestRatio(50)).toBeNull();
    expect(SIMPLE_RATIOS.find((r) => r.label === 'quinte')!.num).toBe(3);
  });
});
