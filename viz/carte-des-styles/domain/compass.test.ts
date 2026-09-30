import { describe, expect, it } from 'vitest';
import type { StyleRose } from '../data/contract';
import { CLASSES, DIMS, classLabel, cosine, liftWords, nearestStyles, radius, roseAxes, shares, signatures, topTransitions, transitionLabel } from './compass';

describe('boussole', () => {
  it('nomme les classes et les transitions', () => {
    expect(classLabel(0)).toBe('I');
    expect(classLabel(1)).toBe('i');
    expect(classLabel(14)).toBe('V');
    expect(transitionLabel([14, 0])).toBe('V → I');
  });
  it('calcule les parts et les transitions les plus fréquentes', () => {
    const counts = new Array<number>(DIMS).fill(0);
    counts[14 * CLASSES + 0] = 30;
    counts[0 * CLASSES + 14] = 20;
    counts[10 * CLASSES + 0] = 50;
    const s = shares(counts);
    expect(s[10 * CLASSES + 0]).toBeCloseTo(0.5);
    expect(topTransitions(s, 2).map((t) => t.transition)).toEqual([
      [10, 0],
      [14, 0],
    ]);
  });
  it('borne le rayon en échelle log', () => {
    expect(radius(1)).toBeCloseTo(0.5);
    expect(radius(2)).toBeCloseTo(0.75);
    expect(radius(4)).toBe(1);
    expect(radius(8)).toBe(1);
    expect(radius(0.25)).toBe(0);
    expect(radius(0)).toBe(0);
  });
  it('donne les rapports par axe et les signatures', () => {
    const base = new Array<number>(DIMS).fill(0);
    const style = new Array<number>(DIMS).fill(0);
    base[0] = 0.5;
    base[1] = 0.3;
    base[2] = 0.2;
    style[0] = 0.25;
    style[1] = 0.6;
    style[2] = 0.15;
    const axes = topTransitions(base, 3);
    const r = roseAxes(style, base, axes);
    expect(r[0]).toBeCloseTo(0.5);
    expect(r[1]).toBeCloseTo(2);
    expect(r[2]).toBeCloseTo(0.75);
    const sig = signatures(style, base, 2, 0.1);
    expect(sig[0]).toMatchObject({ from: 0, to: 1, lift: 2 });
    expect(sig).toHaveLength(2);
    expect(signatures(style, base, 5, 0.5)).toHaveLength(1);
  });
  it('classe les styles par ressemblance', () => {
    const mk = (key: string, centroid: number[]): StyleRose => ({ key, label: key, kind: 'genre', songs: 1, transitions: 1, axes: [], signatures: [], centroid });
    const styles = [mk('a', [1, 0, 0]), mk('b', [0, 1, 0]), mk('c', [1, 1, 0])];
    const r = nearestStyles([1, 0.2, 0], styles);
    expect(r[0]!.style.key).toBe('a');
    expect(r[1]!.style.key).toBe('c');
    expect(cosine([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosine([1, 0], [0, 1])).toBe(0);
  });
  it('met les rapports en mots', () => {
    expect(liftWords(2.3)).toBe('2,3 × plus que la moyenne');
    expect(liftWords(0.5)).toBe('2 × moins que la moyenne');
    expect(liftWords(1)).toBe('comme la moyenne');
  });
});
