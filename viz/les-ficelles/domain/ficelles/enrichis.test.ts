import { describe, expect, it } from 'vitest';
import { cliche, lireAccord, type Grille } from '../grille';
import { nomAccord } from '../orthographe';
import { enrichis } from './enrichis';

const grille = (s: string, key = 0): Grille => s.split(' ').map((x) => lireAccord(x, key)!);
const nomApres = (g: Grille, i: number) => nomAccord(enrichis.appliquer(g, i).grille[i]!);

describe('les accords enrichis', () => {
  it('vise les triades de la gamme sans basse écrite', () => {
    expect(enrichis.endroits(cliche(0))).toEqual([0, 1, 2, 3]);
    expect(enrichis.endroits(grille('Si° Do/Si Mi Fa7M'))).toEqual([]);
  });

  it('choisit la septième selon le degré', () => {
    expect(nomApres(cliche(0), 0)).toBe('Do7M');
    expect(nomApres(cliche(0), 1)).toBe('La m7');
    expect(nomApres(cliche(0), 2)).toBe('Fa7M');
    expect(nomApres(cliche(0), 3)).toBe('Sol7');
    expect(enrichis.appliquer(cliche(0), 2).touches).toEqual([2]);
  });

  it('nomme la note ajoutée', () => {
    expect(enrichis.explique(cliche(0), 2)).toContain('on ajoute mi');
    expect(enrichis.explique(cliche(0), 3)).toContain('on ajoute fa');
  });
});
