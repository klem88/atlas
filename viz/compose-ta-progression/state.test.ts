import { describe, expect, it } from 'vitest';
import { progressionLabel } from '@shell/music/degrees';
import { readStateFromUrl, stateToSearch } from './state';

describe('état ↔ URL', () => {
  it('lit une suite vide, une suite, une tonalité, un style', () => {
    expect(readStateFromUrl('').progression).toEqual([]);
    const s = readStateFromUrl('?p=I,V,vi&t=Eb&style=pop%20rock');
    expect(progressionLabel(s.progression)).toBe('I–V–vi');
    expect(s.tonic).toBe(3);
    expect(s.style).toBe('pop rock');
    expect(stateToSearch(s)).toBe('?p=I,V,vi&t=Eb&style=pop%20rock');
    expect(stateToSearch(readStateFromUrl(''))).toBe('');
    expect(readStateFromUrl('?p=I,zz').progression).toEqual([]);
  });
});
