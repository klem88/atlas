import { describe, expect, it } from 'vitest';
import { cliche, lireAccord, type Grille } from '../grille';
import { nomAccord } from '../orthographe';
import { descend, passages } from './descend';

const grille = (s: string, key = 0): Grille => s.split(' ').map((x) => lireAccord(x, key)!);
const noms = (g: Grille) => g.map(nomAccord);

describe('passages', () => {
  it('donne les notes de la gamme entre deux basses, en descendant', () => {
    expect(passages(0, 9, 0)).toEqual([11]);
    expect(passages(0, 7, 0)).toEqual([11, 9]);
    expect(passages(9, 5, 0)).toEqual([7]);
  });
});

describe('la basse qui descend', () => {
  it('trouve les tierces et les quartes descendantes', () => {
    expect(descend.endroits(cliche(0))).toEqual([0, 1]); // Do → La m, La m → Fa
    expect(descend.endroits(grille('Do Sol'))).toEqual([0]); // quarte descendante (do, si, la, sol)
  });

  it('refuse les basses qui montent ou descendent d\'un pas', () => {
    expect(descend.endroits(grille('Fa Sol'))).toEqual([]);
    expect(descend.endroits(grille('Do Si°'))).toEqual([]);
  });

  it('garde l\'accord et fait passer la basse', () => {
    const r = descend.appliquer(cliche(0), 0);
    expect(noms(r.grille)).toEqual(['Do', 'Do/Si', 'La m', 'Fa', 'Sol']);
    expect(r.touches).toEqual([1]);
    expect(noms(descend.appliquer(grille('Do Sol'), 0).grille)).toEqual(['Do', 'Do/Si', 'Do/La', 'Sol']);
    expect(noms(descend.appliquer(cliche(0), 1).grille)).toEqual(['Do', 'La m', 'La m/Sol', 'Fa', 'Sol']);
  });

  it('allume la paire et s\'explique', () => {
    expect(descend.zone(cliche(0), 0)).toEqual([0, 1]);
    expect(descend.explique(cliche(0), 0)).toContain('do, si, la');
    expect(descend.pourquoiPas(grille('Fa Sol'))).toContain('Do puis La m');
  });
});
