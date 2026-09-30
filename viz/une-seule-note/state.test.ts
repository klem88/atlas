import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE, readStateFromUrl, stateToSearch } from './state';

describe('état dans l’URL', () => {
  it('sans paramètre : do2, les seize rangs', () => {
    expect(readStateFromUrl('')).toEqual(DEFAULT_STATE);
    expect(DEFAULT_STATE.ranks).toHaveLength(16);
  });
  it('lit la fondamentale et les rangs, ignore l’invalide', () => {
    expect(readStateFromUrl('?fondamentale=48&rangs=1,4,5,6')).toEqual({ fundamental: 48, ranks: [1, 4, 5, 6] });
    expect(readStateFromUrl('?fondamentale=60&rangs=0,3,3,99')).toEqual({ fundamental: 36, ranks: [3] });
    expect(readStateFromUrl('?rangs=')).toEqual({ fundamental: 36, ranks: [] });
  });
  it('n’écrit que ce qui diffère, et fait l’aller-retour', () => {
    expect(stateToSearch(DEFAULT_STATE)).toBe('');
    const s = { fundamental: 24 as const, ranks: [4, 5, 6, 7] };
    expect(stateToSearch(s)).toBe('?fondamentale=24&rangs=4,5,6,7');
    expect(readStateFromUrl(stateToSearch(s))).toEqual(s);
  });
});
