import { describe, expect, it } from 'vitest';
import { CHORUS_STAGGER, planChorus } from './chorus';
import { frenchList, inSentence, presenceClass } from './presence';

describe('presenceClass', () => {
  it('range par part des observations, à seuils fixes', () => {
    expect(presenceClass(300, 10_000)).toBe(0); // 3 %
    expect(presenceClass(100, 10_000)).toBe(1); // 1 %
    expect(presenceClass(20, 10_000)).toBe(2); // 0,2 %
    expect(presenceClass(5, 10_000)).toBe(3); // 0,05 %
  });

  it('classe « rare » quand il n’y a pas d’observations', () => {
    expect(presenceClass(0, 0)).toBe(3);
  });
});

describe('textes', () => {
  it('énumère à la française', () => {
    expect(frenchList(['a'])).toBe('a');
    expect(frenchList(['a', 'b', 'c'])).toBe('a, b et c');
  });

  it('met le nom en minuscule dans une phrase', () => {
    expect(inSentence('Merle noir')).toBe('merle noir');
  });
});

describe('planChorus', () => {
  const local = [
    { count: 400, duration: 15 },
    { count: 300, duration: null },
    { count: 100, duration: 12 },
    { count: 25, duration: 15 },
  ];

  it('ne prend que les espèces qui ont un chant, dans l’ordre de présence', () => {
    expect(planChorus(local).voices.map((v) => v.index)).toEqual([0, 2, 3]);
  });

  it('fait entrer les voix l’une après l’autre', () => {
    const plan = planChorus(local);
    expect(plan.voices.map((v) => v.start)).toEqual([0, CHORUS_STAGGER, 2 * CHORUS_STAGGER]);
    expect(plan.duration).toBe(2 * CHORUS_STAGGER + 15);
  });

  it('fait chanter plus fort les plus présentes', () => {
    const [a, b, c] = planChorus(local).voices;
    expect(a!.gain).toBe(1);
    expect(b!.gain).toBeLessThan(a!.gain);
    expect(c!.gain).toBeLessThan(b!.gain);
    expect(c!.gain).toBeGreaterThan(0.35);
  });

  it('limite le nombre de voix', () => {
    expect(planChorus(local, 2).voices).toHaveLength(2);
  });

  it('reste vide sans chant', () => {
    expect(planChorus([{ count: 3, duration: null }])).toEqual({ voices: [], duration: 0 });
  });
});
