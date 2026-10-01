import { describe, expect, it } from 'vitest';
import { readStateFromUrl, stateToSearch } from './state';

describe('état dans l’URL', () => {
  it('valeurs par défaut', () => {
    expect(readStateFromUrl('')).toEqual({ progression: 'pop', view: 'cercle', tonic: 0 });
    expect(stateToSearch(readStateFromUrl(''))).toBe('');
  });

  it('aller-retour', () => {
    const s = readStateFromUrl('?p=blues&vue=ligne&t=F%23');
    expect(s).toEqual({ progression: 'blues', view: 'ligne', tonic: 6 });
    expect(readStateFromUrl(stateToSearch(s))).toEqual(s);
  });

  it('ignore les valeurs inconnues', () => {
    expect(readStateFromUrl('?p=nimporte&vue=cube')).toEqual({ progression: 'pop', view: 'cercle', tonic: 0 });
  });
});
