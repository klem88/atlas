import { describe, expect, it } from 'vitest';
import { readStateFromUrl, stateToSearch } from './state';

describe('état ↔ URL', () => {
  it('lit, valide et réécrit', () => {
    const s = readStateFromUrl('?morceau=12&soliste=34&mesure=temps&accord=G-7');
    expect(s).toEqual({ tune: '12', solo: 34, onBeat: true, chord: 'G-7' });
    expect(stateToSearch(s)).toBe('?morceau=12&soliste=34&mesure=temps&accord=G-7');
    expect(readStateFromUrl('?morceau=x&soliste=-1&accord=<b>')).toEqual({ tune: null, solo: null, onBeat: false, chord: null });
    expect(stateToSearch(readStateFromUrl(''))).toBe('');
    expect(stateToSearch({ tune: '1', solo: null, onBeat: false, chord: 'Bb7/F' })).toBe('?morceau=1&accord=Bb7/F');
  });
});
