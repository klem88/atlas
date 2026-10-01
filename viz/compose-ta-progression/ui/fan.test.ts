import { describe, expect, it } from 'vitest';
import type { Candidate } from '../domain/next';
import { layoutFan } from './fan';

const cands: Candidate[] = [0.5, 0.25, 0.12, 0.06, 0.03, 0.02, 0.01, 0.005, 0.004, 0.003].map((p, i) => ({ degree: { step: i, cls: 'maj' }, key: String(i), count: Math.round(p * 1000), p }));

describe('disposition de l’éventail', () => {
  const layout = layoutFan(cands, { width: 640, nameOf: (c) => c.key, subOf: (c) => `${Math.round(c.p * 100)} %`, other: 0.01 });
  it('met le plus probable au centre, en haut, et les autres de part et d’autre', () => {
    const top = layout.discs.find((d) => d.rank === 0)!;
    expect(Math.abs(top.x - layout.cx)).toBeLessThan(1);
    expect(top.y).toBeLessThan(layout.cy);
    const second = layout.discs.find((d) => d.rank === 1)!;
    const third = layout.discs.find((d) => d.rank === 2)!;
    expect((second.x - layout.cx) * (third.x - layout.cx)).toBeLessThan(0);
  });
  it('ne fait pas se chevaucher les disques et regroupe le reste', () => {
    for (let i = 0; i < layout.discs.length; i++) {
      for (let j = i + 1; j < layout.discs.length; j++) {
        const a = layout.discs[i]!;
        const b = layout.discs[j]!;
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(a.r + b.r - 0.5);
      }
    }
    expect(layout.discs.filter((d) => d.candidate).length).toBe(9);
    expect(layout.discs.some((d) => !d.candidate)).toBe(true);
    expect(layout.discs.every((d) => d.r >= 12)).toBe(true);
  });
  it('tient dans une petite largeur', () => {
    const small = layoutFan(cands, { width: 340, nameOf: (c) => c.key, subOf: () => '', other: 0 });
    for (const d of small.discs) {
      expect(d.x - d.r).toBeGreaterThanOrEqual(-2);
      expect(d.x + d.r).toBeLessThanOrEqual(342);
    }
  });
});
