import { describe, expect, it } from 'vitest';
import { parseChord } from '@shell/music/chords';
import {
  L,
  P,
  PLR_DISTANCE,
  R,
  TRIADS,
  latticeOf,
  nearestTriad,
  pathBetween,
  pathStats,
  plrDistance,
  shortestDelta,
  torusCoords,
  torusPoint,
  triadIndex,
  triadLattice,
  triadTorus,
  type Triad,
} from './tonnetz';

const M = (root: number): Triad => ({ root, mode: 'maj' });
const m = (root: number): Triad => ({ root, mode: 'min' });

describe('réseau', () => {
  it('place les douze classes de hauteur sans doublon', () => {
    const seen = new Set<string>();
    for (let pc = 0; pc < 12; pc++) {
      const { a, b } = latticeOf(pc);
      expect((7 * a + 4 * b) % 12).toBe(pc);
      seen.add(`${a},${b}`);
    }
    expect(seen.size).toBe(12);
  });
  it('replie le réseau sur le tore : (4, 2) et (0, 3) reviennent au même point', () => {
    const o = torusCoords(1, 1);
    const p = torusCoords(5, 3);
    const q = torusCoords(1, 4);
    expect(p.s).toBeCloseTo(o.s);
    expect(p.t).toBeCloseTo(o.t);
    expect(q.s).toBeCloseTo(o.s);
    expect(q.t).toBeCloseTo(o.t);
  });
  it('donne aux 24 triades 24 positions distinctes', () => {
    const pts = TRIADS.map((t) => {
      const { s, t: tt } = triadTorus(t);
      return `${s.toFixed(3)},${tt.toFixed(3)}`;
    });
    expect(new Set(pts).size).toBe(24);
  });
  it('rapproche les triades voisines : do majeur et la mineur partagent deux notes', () => {
    const c = triadTorus(M(0));
    // R, L, P : les trois voisins du triangle de do majeur sont à moins d'une cellule sur le tore (quatre colonnes, trois rangées).
    for (const n of [m(9), m(4), m(0)]) {
      const { ds, dt } = shortestDelta(c, triadTorus(n));
      expect(Math.abs(ds)).toBeLessThan(0.25);
      expect(Math.abs(dt)).toBeLessThan(1 / 3);
    }
    expect(triadLattice(M(0))).toEqual({ a: 1 / 3, b: 1 / 3 });
  });
  it('projette sur un tore de rayons donnés', () => {
    const p = torusPoint(0, 0);
    expect(p.x).toBeCloseTo(2.1 + 0.95);
    expect(p.y).toBeCloseTo(0);
    const q = torusPoint(0.25, 0.5);
    expect(q.x).toBeCloseTo(0);
    expect(q.z).toBeCloseTo(2.1 - 0.95);
  });
  it('prend le plus court chemin en tenant compte de l’enroulement', () => {
    expect(shortestDelta({ s: 0.9, t: 0.1 }, { s: 0.1, t: 0.9 })).toEqual({ ds: expect.closeTo(0.2, 6), dt: expect.closeTo(-0.2, 6) });
    const path = pathBetween({ s: 0.9, t: 0 }, { s: 0.1, t: 0 }, 2);
    expect(path.map((p) => p.s)).toEqual([expect.closeTo(0.9, 6), expect.closeTo(0, 6), expect.closeTo(0.1, 6)]);
  });
});

describe('P, L, R', () => {
  it('sont des involutions et relient les bons accords', () => {
    expect(P(M(0))).toEqual(m(0));
    expect(R(M(0))).toEqual(m(9));
    expect(L(M(0))).toEqual(m(4));
    for (const t of TRIADS) {
      expect(P(P(t))).toEqual(t);
      expect(R(R(t))).toEqual(t);
      expect(L(L(t))).toEqual(t);
    }
  });
  it('donne des distances symétriques, nulles sur la diagonale, et connues', () => {
    for (let i = 0; i < 24; i++) for (let j = 0; j < 24; j++) expect(PLR_DISTANCE[i * 24 + j]).toBe(PLR_DISTANCE[j * 24 + i]);
    expect(plrDistance(M(0), M(0))).toBe(0);
    expect(plrDistance(M(0), m(9))).toBe(1);
    expect(plrDistance(M(0), M(7))).toBe(2); // C → e (L) → G (R)
    expect(plrDistance(M(0), M(5))).toBe(2); // C → a (R) → F (L)
    expect(plrDistance(M(0), M(4))).toBe(2); // C → e (L) → E (P)
    expect(plrDistance(M(0), M(8))).toBe(2); // C → c (P) → Ab (L)
    expect(plrDistance(M(0), M(2))).toBe(4); // un ton : aucune note commune, quatre pas (C → e → G → b → D)
    expect(plrDistance(M(0), M(6))).toBeGreaterThanOrEqual(3); // le triton : loin
    expect(Math.max(...PLR_DISTANCE)).toBeLessThanOrEqual(5);
    expect(PLR_DISTANCE.every((d) => d >= 0)).toBe(true);
  });
});

describe('réduction et chemin', () => {
  it('ramène un accord à sa triade', () => {
    expect(nearestTriad(parseChord('G7')!)).toEqual({ triad: M(7), exact: true });
    expect(nearestTriad(parseChord('Dm7')!)).toEqual({ triad: m(2), exact: true });
    expect(nearestTriad(parseChord('Bø7')!)).toEqual({ triad: m(11), exact: false });
    expect(nearestTriad(parseChord('Csus4')!)).toEqual({ triad: M(0), exact: false });
    expect(nearestTriad(parseChord('C+')!)).toEqual({ triad: M(0), exact: false });
  });
  it('résume un chemin : pas, moyenne, plus grand saut', () => {
    // Giant Steps, début : B D7 G Bb7 Eb → B, D, G, Bb, Eb majeurs
    const s = pathStats([M(11), M(2), M(7), M(10), M(3)]);
    expect(s.steps).toHaveLength(4);
    expect(s.mean).toBeGreaterThan(1.5);
    expect(s.longest!.distance).toBe(Math.max(...s.steps.map((x) => x.distance)));
    // Répétitions et silences ignorés ; F → G (un ton) vaut quatre pas
    const r = pathStats([M(0), M(0), null, m(9), M(5), M(7)]);
    expect(r.steps.map((x) => x.distance)).toEqual([1, 1, 4]);
    expect(r.histogram[1]).toBe(2);
    expect(r.steps[0]!.index).toBe(3);
  });
  it('indexe les 24 triades', () => {
    TRIADS.forEach((t, i) => expect(triadIndex(t)).toBe(i));
  });
});
