import { describe, expect, it } from 'vitest';
import { cliche } from '../grille';
import { nomAccord } from '../orthographe';
import { montee } from './montee';

describe('la montée finale', () => {
  it(`s'applique une fois, à la fin`, () => {
    expect(montee.endroits(cliche(0))).toEqual([3]);
    const r = montee.appliquer(cliche(0), 3);
    expect(montee.endroits(r.grille)).toEqual([]);
  });

  it('rejoue la progression un ton plus haut, amenée par la dominante', () => {
    const r = montee.appliquer(cliche(0), 3);
    expect(r.grille.map(nomAccord)).toEqual(['Do', 'La m', 'Fa', 'Sol', 'La7', 'Ré', 'Si m', 'Sol', 'La']);
    expect(r.touches).toEqual([4, 5, 6, 7, 8]);
    expect(r.grille[5]!.key).toBe(2);
  });

  it('nomme la dominante et la nouvelle tonique', () => {
    expect(montee.explique(cliche(0), 3)).toContain('La7, la dominante de Ré');
  });
});
