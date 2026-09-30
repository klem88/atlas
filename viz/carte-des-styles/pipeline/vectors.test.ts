import { describe, expect, it } from 'vitest';
import { degreeToken, parseDegreeLabel } from '@shell/music/degrees';
import { CLASSES, DIMS, classOfToken, knnAccuracy, pca, project, silhouette, songVector } from './vectors';

const T = (s: string) => degreeToken(parseDegreeLabel(s)!);

describe('vecteur d’un morceau', () => {
  it('range les degrés en 24 classes', () => {
    expect(classOfToken(T('I'))).toBe(0);
    expect(classOfToken(T('i'))).toBe(1);
    expect(classOfToken(T('V'))).toBe(14);
    expect(classOfToken(T('vii°'))).toBe(23);
    expect(classOfToken(T('Isus'))).toBe(0);
  });
  it('compte les transitions en racine de fréquence, par section', () => {
    const tokens = [T('I'), T('V'), T('I'), T('V'), 255, T('vi'), T('IV')];
    const v = songVector(tokens, 1)!;
    expect(v).toHaveLength(DIMS);
    // I→V deux fois, V→I une fois, vi→IV une fois : 4 transitions
    expect(v[0 * CLASSES + 14]).toBeCloseTo(Math.sqrt(2 / 4));
    expect(v[14 * CLASSES + 0]).toBeCloseTo(Math.sqrt(1 / 4));
    expect(v[classOfToken(T('vi')) * CLASSES + classOfToken(T('IV'))]).toBeCloseTo(0.5);
    expect(songVector(tokens, 5)).toBeNull();
  });
});

describe('ACP et séparation', () => {
  it('retrouve l’axe principal d’un nuage allongé', () => {
    const rows: Float32Array[] = [];
    for (let i = 0; i < 200; i++) {
      const r = new Float32Array(4);
      const t = (i / 200 - 0.5) * 10;
      r[0] = t;
      r[1] = 2 * t + ((i % 7) - 3) * 0.05;
      r[2] = ((i % 5) - 2) * 0.1;
      r[3] = 1;
      rows.push(r);
    }
    const p = pca(rows, 2, 4);
    const c = p.components[0]!;
    expect(Math.abs(c[1]! / c[0]!)).toBeCloseTo(2, 1);
    expect(p.variances[0]!).toBeGreaterThan(p.variances[1]! * 20);
    const proj = project(p, rows[0]!, 2);
    expect(proj).toHaveLength(2);
  });
  it('mesure la séparation : deux amas nets, puis un mélange', () => {
    const A = Array.from({ length: 30 }, (_, i) => [i % 3, (i % 5) * 0.1]);
    const B = Array.from({ length: 30 }, (_, i) => [20 + (i % 3), (i % 5) * 0.1]);
    const labels = [...A.map(() => 0), ...B.map(() => 1)];
    const s = silhouette([...A, ...B], labels);
    expect(s.overall).toBeGreaterThan(0.8);
    expect(knnAccuracy([...A, ...B], labels, 5)).toBe(1);
    const mixed = silhouette([...A, ...A.map((p) => [p[0]! + 0.01, p[1]!])], labels);
    expect(mixed.overall).toBeLessThan(0.1);
  });
});
