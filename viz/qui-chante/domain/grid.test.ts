import { describe, expect, it } from 'vitest';
import { GRID, type GridSpec } from '../data/contract';
import { blockOf, cellAt, cellBounds, cellCoords, cellWkt, neighborhood } from './grid';

const small: GridSpec = { lon0: 0, lat0: 40, dLon: 1, dLat: 1, cols: 4, rows: 3, block: 2 };

describe('cellAt', () => {
  it('numérote les mailles ligne par ligne depuis le sud-ouest', () => {
    expect(cellAt(small, 0.5, 40.5)).toBe(0);
    expect(cellAt(small, 3.5, 40.5)).toBe(3);
    expect(cellAt(small, 0.5, 41.5)).toBe(4);
    expect(cellAt(small, 3.9, 42.9)).toBe(11);
  });

  it('renvoie null hors de la grille', () => {
    expect(cellAt(small, -0.1, 40.5)).toBeNull();
    expect(cellAt(small, 4, 40.5)).toBeNull();
    expect(cellAt(small, 1, 43)).toBeNull();
  });

  it('couvre toute la métropole et la Corse', () => {
    const points: [string, number, number][] = [
      ['Pointe de Corsen (ouest)', -4.795, 48.413],
      ['Lauterbourg (est)', 8.23, 48.967],
      ['Bray-Dunes (nord)', 2.545, 51.089],
      ['Bonifacio (sud)', 9.159, 41.387],
      ['Cap Corse (est)', 9.56, 42.99],
    ];
    for (const [name, lon, lat] of points) expect(cellAt(GRID, lon, lat), name).not.toBeNull();
  });
});

describe('cellBounds / cellWkt', () => {
  it('retrouve le rectangle de la maille', () => {
    expect(cellCoords(small, 6)).toEqual({ col: 2, row: 1 });
    expect(cellBounds(small, 6)).toEqual([2, 41, 3, 42]);
  });

  it('écrit un polygone fermé, antihoraire', () => {
    expect(cellWkt(small, 6)).toBe('POLYGON((2 41,3 41,3 42,2 42,2 41))');
  });

  it('évite les erreurs d’arrondi flottant', () => {
    const [w, s] = cellBounds(GRID, 1);
    expect(w).toBe(-5.17);
    expect(s).toBe(41.3);
  });
});

describe('neighborhood', () => {
  it('donne 9 mailles au milieu de la grille', () => {
    expect(neighborhood(small, 5).sort((a, b) => a - b)).toEqual([0, 1, 2, 4, 5, 6, 8, 9, 10]);
  });

  it('s’arrête aux bords sans déborder sur la ligne voisine', () => {
    expect(neighborhood(small, 0).sort((a, b) => a - b)).toEqual([0, 1, 4, 5]);
    expect(neighborhood(small, 7).sort((a, b) => a - b)).toEqual([2, 3, 6, 7, 10, 11]);
  });
});

describe('blockOf', () => {
  it('regroupe les mailles par blocs', () => {
    expect(blockOf(small, 0)).toBe('0-0');
    expect(blockOf(small, 3)).toBe('1-0');
    expect(blockOf(small, 9)).toBe('0-1');
  });
});
