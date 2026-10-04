import { describe, expect, it } from 'vitest';
import { cliche } from './grille';
import { nomAccord } from './orthographe';
import { EXEMPLE, rejouer, retirer } from './pile';

describe('la pile', () => {
  it('rejoue les ficelles dans l’ordre (la phrase de la page)', () => {
    const r = rejouer(cliche(0), EXEMPLE);
    expect(r.grille.map(nomAccord)).toEqual(['Do', 'Do/Si', 'La m', 'Fa', 'Fa m', 'Fa/Sol']);
    expect(r.gardes).toEqual(EXEMPLE);
    expect(r.tombes).toEqual([]);
  });

  it('fait tomber une ficelle qui n’a plus son endroit', () => {
    const r = rejouer(cliche(0), retirer(EXEMPLE, 0));
    // Sans la basse qui descend, l'emprunt (3) et le Sol suspendu (5) visaient des accords qui n'existent plus.
    expect(r.grille.map(nomAccord)).toEqual(['Do', 'La m', 'Fa', 'Sol']);
    expect(r.tombes.map((g) => g.id)).toEqual(['emprunt', 'suspendu']);
  });

  it('retire par position', () => {
    expect(retirer(EXEMPLE, 1).map((g) => g.id)).toEqual(['descend', 'suspendu']);
  });
});
