import { describe, expect, it } from 'vitest';
import { cliche, lireAccord, type Grille } from '../grille';
import { nomAccord } from '../orthographe';
import { dominante } from './dominante';

const grille = (s: string, key = 0): Grille => s.split(' ').map((x) => lireAccord(x, key)!);
const noms = (g: Grille) => g.map(nomAccord);

describe('la dominante qui annonce', () => {
  it('vise tout accord majeur ou mineur après le premier', () => {
    expect(dominante.endroits(cliche(0))).toEqual([1, 2, 3]);
  });

  it('ne double pas une dominante déjà là, et laisse les diminués', () => {
    expect(dominante.endroits(grille('Sol Do'))).toEqual([]);
    expect(dominante.endroits(grille('Sol7 Do'))).toEqual([]);
    expect(dominante.endroits(grille('Do Si°'))).toEqual([]);
  });

  it('insère la septième de dominante juste avant', () => {
    const r = dominante.appliquer(cliche(0), 1);
    expect(noms(r.grille)).toEqual(['Do', 'Mi7', 'La m', 'Fa', 'Sol']);
    expect(r.touches).toEqual([1]);
    expect(dominante.zone(cliche(0), 1)).toEqual([0, 1]);
  });

  it('dit quelle note tire vers la cible', () => {
    expect(dominante.explique(cliche(0), 1)).toContain('sol♯ monte d\'un demi-ton vers le la');
  });
});
