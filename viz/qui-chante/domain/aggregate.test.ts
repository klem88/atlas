import { describe, expect, it } from 'vitest';
import { aggregate, type CellObservations } from './aggregate';

const cell = (total: number, entries: [number, number][]): CellObservations => ({ total, bySpecies: new Map(entries) });

describe('aggregate', () => {
  it('additionne les mailles et trie par nombre d’observations', () => {
    const r = aggregate(
      [
        cell(100, [
          [1, 40],
          [2, 10],
        ]),
        cell(50, [
          [2, 35],
          [3, 6],
        ]),
      ],
      5,
    );
    expect(r.total).toBe(150);
    expect(r.species).toEqual([
      { key: 2, count: 45 },
      { key: 1, count: 40 },
      { key: 3, count: 6 },
    ]);
  });

  it('écarte les espèces sous le seuil, même vues dans plusieurs mailles', () => {
    const r = aggregate([cell(10, [[7, 2]]), cell(10, [[7, 2]]), cell(10, [[8, 5]])], 5);
    expect(r.species.map((s) => s.key)).toEqual([8]);
  });

  it('ignore les mailles sans données', () => {
    expect(aggregate([undefined, cell(3, [[1, 3]])], 1)).toEqual({ total: 3, species: [{ key: 1, count: 3 }] });
  });

  it('départage les égalités par clé', () => {
    const r = aggregate(
      [
        cell(20, [
          [9, 10],
          [4, 10],
        ]),
      ],
      1,
    );
    expect(r.species.map((s) => s.key)).toEqual([4, 9]);
  });
});
