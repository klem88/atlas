import { describe, expect, it } from 'vitest';
import { candidates, type Rows } from './halos';

const rows: Rows = {
  'V,I': [50],
  'V,vi': [30],
  'V,IV': [10],
  'V,bVII': [5],
  'V,II': [3],
  'V,III': [1.5],
  'V,bII': [0.5],
  'IV,I': [99],
};

describe('candidates', () => {
  it('au départ : les sept accords, sans part', () => {
    const c = candidates(null, 0, rows);
    expect(c.map((x) => x.label)).toEqual(['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']);
    expect(c.every((x) => x.share === null && !x.satellite)).toBe(true);
  });

  it('après Sol en Do : la gamme toujours, les parts sur toutes les suites, trois satellites au plus', () => {
    const c = candidates({ root: 7, cls: 'maj' }, 0, rows);
    const byLabel = Object.fromEntries(c.map((x) => [x.label, x]));
    expect(c.filter((x) => !x.satellite).map((x) => x.label)).toEqual(['I', 'ii', 'iii', 'IV', 'vi', 'vii°']);
    expect(byLabel.I!.share).toBeCloseTo(0.5);
    expect(byLabel.vi!.share).toBeCloseTo(0.3);
    expect(byLabel.ii!.share).toBe(0);
    expect(c.filter((x) => x.satellite).map((x) => x.label)).toEqual(['♭VII', 'V/V', 'V/vi']);
    expect(byLabel['♭VII']!.anchor).toBe('vii°');
    const sum = c.reduce((s, x) => s + (x.share ?? 0), 0);
    expect(sum).toBeLessThanOrEqual(1);
  });

  it('respecte le nombre de satellites et le seuil de 1 %', () => {
    const c = candidates({ root: 7, cls: 'maj' }, 0, rows, 1);
    expect(c.filter((x) => x.satellite).map((x) => x.label)).toEqual(['♭VII']);
    expect(candidates({ root: 7, cls: 'maj' }, 0, rows).some((x) => x.label === '♭II')).toBe(false);
  });

  it("lit l'accord en degré de la tonalité du moment", () => {
    const c = candidates({ root: 11, cls: 'min' }, 7, { 'iii,vi': [8], 'iii,IV': [2] });
    expect(c.find((x) => x.label === 'vi')!.chord).toEqual({ root: 4, cls: 'min' });
    expect(c.find((x) => x.label === 'vi')!.share).toBeCloseTo(0.8);
  });

  it('sans données pour cet accord : des parts nulles, pas de satellites', () => {
    const c = candidates({ root: 7, cls: 'maj' }, 0, {});
    expect(c.every((x) => x.share === 0)).toBe(true);
    expect(c.some((x) => x.satellite)).toBe(false);
  });
});
