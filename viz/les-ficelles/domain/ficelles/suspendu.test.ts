import { describe, expect, it } from 'vitest';
import { cliche, lireAccord, type Grille } from '../grille';
import { nomAccord } from '../orthographe';
import { suspendu } from './suspendu';

const grille = (s: string, key = 0): Grille => s.split(' ').map((x) => lireAccord(x, key)!);
const noms = (g: Grille) => g.map(nomAccord);

describe('la dominante suspendue', () => {
  it('porte un nom vrai dans toute tonalité', () => {
    expect(suspendu.nom).toBe('La dominante suspendue');
  });

  it('vise le V, avec ou sans septième', () => {
    expect(suspendu.endroits(cliche(0))).toEqual([3]);
    expect(suspendu.endroits(grille('Do Sol7'))).toEqual([1]);
    expect(suspendu.endroits(grille('Do Fa'))).toEqual([]);
  });

  it('remplace V par IV/V', () => {
    const r = suspendu.appliquer(cliche(0), 3);
    expect(noms(r.grille)).toEqual(['Do', 'La m', 'Fa', 'Fa/Sol']);
    expect(r.touches).toEqual([3]);
    expect(noms(suspendu.appliquer(cliche(7), 3).grille)[3]).toBe('Do/Ré');
  });

  it('dit ce qui disparaît', () => {
    expect(suspendu.explique(cliche(0), 3)).toContain('plus de si');
    expect(suspendu.pourquoiPas(grille('Do Fa'))).toContain('Sol');
  });
});
