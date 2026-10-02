import { describe, expect, it } from 'vitest';
import type { Chord } from '../../suis-les-fleches/domain/harmony';
import { journeyOf } from './journey';
import { doors, guideOf, hopsTo, nextHop, routeTo } from './route';

const M = (root: number): Chord => ({ root, cls: 'maj' });
const m = (root: number): Chord => ({ root, cls: 'min' });
const dim = (root: number): Chord => ({ root, cls: 'dim' });
const [C, D, E, F, G, A, B] = [0, 2, 4, 5, 7, 9, 11];

describe('la route sur l’anneau', () => {
  it('de voisine en voisine, côté dièses ou bémols (à six crans : dièses)', () => {
    expect(nextHop(C, G)).toBe(G);
    expect(nextHop(C, F)).toBe(F);
    expect(hopsTo(C, A)).toEqual([G, D, A]);
    expect(hopsTo(C, 3)).toEqual([F, 10, 3]);
    expect(hopsTo(C, 6)).toEqual([G, D, A, E, B, 6]);
  });

  it('les portes entre deux tonalités voisines', () => {
    expect(doors(C, G)).toEqual({ pass: [m(B), M(D), dim(6)], back: [m(D), M(F), dim(B)] });
    expect(doors(C, F)).toEqual({ pass: [m(G), M(10), dim(E)], back: [m(E), M(G), dim(B)] });
  });
});

describe('routeTo', () => {
  it('Do vers Sol : commun, tire, confirme, arrive', () => {
    const r = routeTo(journeyOf(C, [M(C), M(G)]), G)!;
    expect([r.target, r.hop, r.hops]).toEqual([G, G, [G]]);
    expect(r.recipe.map((s) => [s.chord, s.why])).toEqual([
      [m(A), 'pivot'],
      [M(D), 'frole'],
      [m(B), 'confirme'],
      [M(G), 'arrivee'],
    ]);
    expect(r.recipe.map((s) => s.here)).toEqual(['vi', 'V/V', 'vii', 'V']);
    expect(r.recipe.map((s) => s.there)).toEqual(['ii', 'V', 'iii', 'I']);
  });

  it('Do vers Fa : Ré m, Si♭, Sol m, Fa', () => {
    const r = routeTo(journeyOf(C, [M(C)]), F)!;
    expect(r.recipe.map((s) => [s.chord, s.why])).toEqual([
      [m(D), 'pivot'],
      [M(10), 'frole'],
      [m(G), 'confirme'],
      [M(F), 'arrivee'],
    ]);
  });

  it('saute le pivot si on y est déjà, et ne garde que la fin quand on penche déjà', () => {
    expect(routeTo(journeyOf(C, [M(C), m(A)]), G)!.recipe.map((s) => s.why)).toEqual(['frole', 'confirme', 'arrivee']);
    expect(routeTo(journeyOf(C, [M(C), M(D)]), G)!.recipe.map((s) => s.chord)).toEqual([m(B), M(G)]);
  });

  it('une destination lointaine guide vers la première voisine', () => {
    const r = routeTo(journeyOf(C, [M(C)]), A)!;
    expect([r.hop, r.hops]).toEqual([G, [G, D, A]]);
    expect(r.recipe[r.recipe.length - 1]!.chord).toEqual(M(G));
  });

  it('rien quand on est déjà dans la tonalité visée', () => {
    expect(routeTo(journeyOf(C, [M(C), m(A), M(D), M(G), m(B)]), G)).toBeNull();
    expect(routeTo(journeyOf(C, []), C)).toBeNull();
  });

  it('au départ, sans accord joué, la recette commence par le pivot', () => {
    expect(routeTo(journeyOf(C, []), G)!.recipe[0]!.chord).toEqual(m(A));
  });
});

describe('guideOf', () => {
  it('mène, commun, ramène, neutre', () => {
    const r = routeTo(journeyOf(C, [M(C)]), G)!;
    expect(guideOf(M(D), r, C)).toBe('mene');
    expect(guideOf(m(B), r, C)).toBe('mene');
    expect(guideOf(m(A), r, C)).toBe('commun');
    expect(guideOf(M(F), r, C)).toBe('ramene');
    expect(guideOf(M(10), r, C)).toBe('neutre');
  });
});
