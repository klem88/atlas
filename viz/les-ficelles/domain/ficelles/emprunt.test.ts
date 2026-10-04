import { describe, expect, it } from 'vitest';
import { cliche, lireAccord, type Grille } from '../grille';
import { nomAccord } from '../orthographe';
import { emprunt } from './emprunt';

const grille = (s: string, key = 0): Grille => s.split(' ').map((x) => lireAccord(x, key)!);
const noms = (g: Grille) => g.map(nomAccord);

describe(`l’emprunt mineur`, () => {
  it('se place après un IV suivi du I ou du V', () => {
    expect(emprunt.endroits(cliche(0))).toEqual([2]); // Fa → Sol
    expect(emprunt.endroits(grille('Fa Do'))).toEqual([0]);
    expect(emprunt.endroits(grille('Fa7M Do'))).toEqual([0]);
    expect(emprunt.endroits(grille('Fa La m'))).toEqual([]);
    expect(emprunt.endroits(grille('Do Sol'))).toEqual([]);
  });

  it('insère le iv', () => {
    const r = emprunt.appliquer(cliche(0), 2);
    expect(noms(r.grille)).toEqual(['Do', 'La m', 'Fa', 'Fa m', 'Sol']);
    expect(r.touches).toEqual([3]);
  });

  it('dit quelle note descend', () => {
    expect(emprunt.explique(grille('Fa Do'), 0)).toContain('la descend au la♭');
    expect(emprunt.pourquoiPas(grille('Do Sol'))).toContain('Fa puis Do');
  });
});
