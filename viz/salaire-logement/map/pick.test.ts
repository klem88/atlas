import { describe, expect, it } from 'vitest';
import { pickCandidates } from './pick';

/** Carré de pixels RGBA à partir d'une grille d'ids (null = pixel de bord semi-transparent). */
function pixels(grid: (number | null)[][]): number[] {
  return grid.flat().flatMap((id) => (id === null ? [10, 0, 0, 128] : [id & 255, (id >> 8) & 255, (id >> 16) & 255, id ? 255 : 0]));
}

describe('pickCandidates', () => {
  it('renvoie la commune sous le centre en premier', () => {
    const data = pixels([
      [1, 1, 2],
      [1, 3, 2],
      [2, 2, 2],
    ]);
    expect(pickCandidates(data, 3, 10).map((c) => c.index)).toEqual([2, 0, 1]);
  });

  it('trouve une commune voisine quand le centre est un bord anticrénelé', () => {
    const data = pixels([
      [0, 0, 0],
      [null, null, 5],
      [0, 0, 0],
    ]);
    expect(pickCandidates(data, 3, 10)).toEqual([{ index: 4, x: 2, y: 1 }]);
  });

  it('écarte le vide et les ids impossibles, nés d’un mélange de couleurs', () => {
    const data = pixels([
      [0, 999, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);
    expect(pickCandidates(data, 3, 10)).toEqual([]);
  });

  it('garde pour chaque commune son pixel le plus proche du centre', () => {
    const data = pixels([
      [7, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 7, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ]);
    expect(pickCandidates(data, 5, 10)).toEqual([{ index: 6, x: 3, y: 2 }]);
  });
});
