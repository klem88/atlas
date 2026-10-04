import { describe, expect, it } from 'vitest';
import { cliche } from './grille';
import { nomAccord } from './orthographe';
import { EXEMPLE, lieux, rejouer, retirer } from './pile';

describe('la pile', () => {
  it('rejoue les ficelles dans l’ordre (la phrase de la page)', () => {
    const r = rejouer(cliche(0), EXEMPLE);
    expect(r.grille.map(nomAccord)).toEqual(['Do', 'Do/Si', 'La m', 'Fa', 'Fa m', 'Fa/Sol']);
    expect(r.gardes).toEqual(EXEMPLE);
    expect(r.tombes).toEqual([]);
  });

  it('fait tomber une ficelle qui n’a plus son endroit', () => {
    const r = rejouer(cliche(0), retirer(EXEMPLE, 0));
    // Sans la basse qui descend, l'emprunt (3) et la dominante suspendue (5) visaient des accords qui n'existent plus.
    expect(r.grille.map(nomAccord)).toEqual(['Do', 'La m', 'Fa', 'Sol']);
    expect(r.tombes.map((g) => g.id)).toEqual(['emprunt', 'suspendu']);
  });

  it('dit où agit chaque ficelle, sur la grille de son moment', () => {
    expect(lieux(cliche(0), EXEMPLE)).toEqual(['entre Do et La m', 'entre Fa et Sol', 'sur Sol']);
    expect(lieux(cliche(0), [{ id: 'dominante', index: 1 }, { id: 'dominante', index: 1 }, { id: 'enrichis', index: 0 }, { id: 'montee', index: 5 }])).toEqual([
      'avant La m',
      'avant Mi7',
      'sur Do',
      'après Sol',
    ]);
  });

  it('retire par position', () => {
    expect(retirer(EXEMPLE, 1).map((g) => g.id)).toEqual(['descend', 'suspendu']);
  });
});
