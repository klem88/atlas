import { describe, expect, it } from 'vitest';
import { ROW_H, nearestInstance, nodeXY, nodesInView, rootOfInstance, triadAt, triadXY, triangleOf, unwrapPath } from './plane';
import type { Triad } from './tonnetz';

const M = (root: number): Triad => ({ root, mode: 'maj' });
const m = (root: number): Triad => ({ root, mode: 'min' });

describe('plan du Tonnetz', () => {
  it('pose les nœuds en triangles équilatéraux', () => {
    const o = nodeXY(0, 0);
    const right = nodeXY(1, 0);
    const up = nodeXY(0, 1);
    const d = (p: { x: number; y: number }, q: { x: number; y: number }) => Math.hypot(p.x - q.x, p.y - q.y);
    expect(d(o, right)).toBeCloseTo(1);
    expect(d(o, up)).toBeCloseTo(1);
    expect(d(right, up)).toBeCloseTo(1);
    expect(up.y).toBeCloseTo(-ROW_H);
  });
  it('les périodes ramènent la même classe de hauteur', () => {
    for (const [a, b] of [
      [4, 2],
      [0, 3],
    ] as [number, number][]) expect((7 * a + 4 * b) % 12).toBe(0);
  });
  it('choisit l’instance la plus proche', () => {
    // La triade de do (0,0) depuis un point proche de (4, 2) : on prend l'instance translatée.
    const from = nodeXY(4.2, 2.1);
    const inst = nearestInstance({ a: 1 / 3, b: 1 / 3 }, from);
    expect(inst).toEqual({ a: 4 + 1 / 3, b: 2 + 1 / 3 });
  });
  it('déroule un chemin sans saut : do → sol → ré restent voisins', () => {
    const p = unwrapPath([M(0), M(7), M(2), M(9)]);
    for (let i = 1; i < p.length; i++) expect(Math.hypot(p[i]!.x - p[i - 1]!.x, p[i]!.y - p[i - 1]!.y)).toBeLessThan(1.5);
    expect(p[0]!.triad).toEqual(M(0));
  });
  it('retrouve la fondamentale d’une instance', () => {
    const c = triadXY(M(0));
    void c;
    expect(rootOfInstance(M(0), 1 / 3, 1 / 3)).toEqual({ a: 0, b: 0 });
    expect(rootOfInstance(m(0), 2 / 3, -1 / 3)).toEqual({ a: 0, b: 0 });
    expect(triangleOf(M(0), 0, 0)).toEqual([
      [0, 0],
      [1, 0],
      [0, 1],
    ]);
    expect(triadAt(1, 0, 'maj')).toEqual(M(7));
    expect(triadAt(0, 1, 'min')).toEqual(m(4));
  });
  it('énumère les nœuds visibles', () => {
    const nodes = nodesInView({ x0: 0, y0: -2, x1: 3, y1: 0 }, 0);
    expect(nodes.length).toBeGreaterThan(8);
    expect(nodes.every((n) => n.pc >= 0 && n.pc < 12)).toBe(true);
  });
});
