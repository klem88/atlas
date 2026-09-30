import { describe, expect, it } from 'vitest';
import { DEFAULT_STATE, readStateFromUrl, stateToSearch } from './state';

describe('état dans l’URL', () => {
  it('sans paramètre : la tierce pure, six harmoniques, do4', () => {
    expect(readStateFromUrl('')).toEqual(DEFAULT_STATE);
  });
  it('lit et borne les valeurs', () => {
    expect(readStateFromUrl('?cents=702&harmoniques=3&grave=48')).toEqual({ cents: 702, harmonics: 3, root: 48 });
    expect(readStateFromUrl('?cents=5000&harmoniques=7&grave=61')).toEqual({ cents: 1200, harmonics: 6, root: 60 });
    expect(readStateFromUrl('?cents=-4')).toEqual({ ...DEFAULT_STATE, cents: 0 });
  });
  it('n’écrit que ce qui diffère, et fait l’aller-retour', () => {
    expect(stateToSearch(DEFAULT_STATE)).toBe('');
    const s = { cents: 0, harmonics: 10 as const, root: 36 as const };
    expect(stateToSearch(s)).toBe('?cents=0&harmoniques=10&grave=36');
    expect(readStateFromUrl(stateToSearch(s))).toEqual(s);
  });
});
