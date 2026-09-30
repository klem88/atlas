import { describe, expect, it } from 'vitest';
import { readStateFromUrl, stateToSearch } from './state';

describe('état ↔ URL', () => {
  it('lit, valide et réécrit', () => {
    expect(readStateFromUrl('?style=pop%20rock&morceau=bb:0629')).toEqual({ style: 'pop rock', song: 'bb:0629' });
    expect(stateToSearch({ style: 'pop rock', song: 'bb:0629' })).toBe('?style=pop%20rock&morceau=bb:0629');
    expect(readStateFromUrl('?style=<x>&morceau=zz')).toEqual({ style: 'irb', song: null });
    expect(stateToSearch(readStateFromUrl(''))).toBe('');
  });
});
