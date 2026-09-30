import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE, readStateFromUrl, stateToSearch } from './state';

describe('état dans l’URL', () => {
  it('sans paramètre : ça monte, en glissando, vitesse normale, vue de côté', () => {
    expect(readStateFromUrl('')).toEqual(DEFAULT_STATE);
  });
  it('lit les quatre réglages et ignore l’invalide', () => {
    expect(readStateFromUrl('?sens=descend&mouvement=marches&vitesse=rapide&vue=dessus')).toEqual({ sens: 'descend', mouvement: 'marches', vitesse: 'rapide', vue: 'dessus' });
    expect(readStateFromUrl('?sens=haut&vitesse=folle')).toEqual(DEFAULT_STATE);
  });
  it('n’écrit que ce qui diffère, et fait l’aller-retour', () => {
    expect(stateToSearch(DEFAULT_STATE)).toBe('');
    const s = { sens: 'descend' as const, mouvement: 'glissando' as const, vitesse: 'lente' as const, vue: 'dessus' as const };
    expect(stateToSearch(s)).toBe('?sens=descend&vitesse=lente&vue=dessus');
    expect(readStateFromUrl(stateToSearch(s))).toEqual(s);
  });
});
