import { describe, expect, it } from 'vitest';
import { harmonicSeries, midiOf, normalizeRanks, sumWave, summarize } from './partials';

describe('série harmonique de do2 (65,4 Hz)', () => {
  const s = harmonicSeries(36);
  it('seize rangs, fréquences multiples de la fondamentale', () => {
    expect(s).toHaveLength(16);
    expect(s[0]!.hz).toBeCloseTo(65.406, 2);
    expect(s[3]!.hz).toBeCloseTo(65.406 * 4, 2);
  });
  it('rangs 1, 2, 4, 8, 16 : des do, à 0 cent', () => {
    for (const k of [1, 2, 4, 8, 16]) {
      const p = s[k - 1]!;
      expect(p.midi % 12).toBe(0);
      expect(p.cents).toBe(0);
    }
  });
  it('rang 3 : la quinte, +2 cents ; rang 5 : la tierce majeure, −14 ; rang 7 : −31 ; rang 11 : −49', () => {
    expect(s[2]!.interval).toBe('quinte');
    expect(s[2]!.cents).toBeCloseTo(2, 0);
    expect(s[4]!.interval).toBe('tierce majeure');
    expect(s[4]!.cents).toBeCloseTo(-13.7, 1);
    expect(s[6]!.cents).toBeCloseTo(-31.2, 1);
    expect(s[6]!.onKey).toBe(false);
    expect(s[10]!.cents).toBeCloseTo(-48.7, 1);
  });
  it('les rangs 4, 5, 6 forment do–mi–sol', () => {
    expect(s[3]!.midi % 12).toBe(0);
    expect(s[4]!.midi % 12).toBe(4);
    expect(s[5]!.midi % 12).toBe(7);
  });
  it('résumé : sur les seize, douze tombent sur une touche (à 15 cents près), la pire est la 11ᵉ', () => {
    const r = summarize(s);
    expect(r.onKey).toBe(12);
    expect(r.offKey).toBe(4);
    expect(r.worst!.k).toBe(11);
  });
});

describe('outils', () => {
  it('midi d’une fréquence', () => {
    expect(midiOf(440)).toBeCloseTo(69, 9);
    expect(midiOf(880)).toBeCloseTo(81, 9);
  });
  it('onde somme : sinus de la fondamentale seule, puis somme en 1/k', () => {
    expect(sumWave([1], 0.25)).toBeCloseTo(1, 9);
    expect(sumWave([1, 2], 0.125)).toBeCloseTo(Math.sin(Math.PI / 4) + 0.5 * Math.sin(Math.PI / 2), 9);
    expect(sumWave([], 0.3)).toBe(0);
  });
  it('normalise les rangs', () => {
    expect(normalizeRanks([6, 4, 4, 0, 17, 5])).toEqual([4, 5, 6]);
  });
});
