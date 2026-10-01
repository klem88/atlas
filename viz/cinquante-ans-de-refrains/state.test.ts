import { describe, expect, it } from 'vitest';
import { readStateFromUrl, stateToSearch } from './state';

describe('état ↔ URL', () => {
  it('lit, valide et réécrit', () => {
    const s = readStateFromUrl('?mesure=mineurs&corpus=billboard&style=pop%20rock&annee=1975');
    expect(s).toEqual({ measure: 'mineurs', corpus: 'billboard', style: 'pop rock', year: 1975 });
    expect(stateToSearch(s)).toBe('?mesure=mineurs&corpus=billboard&style=pop%20rock&annee=1975');
    expect(readStateFromUrl('?mesure=zz&corpus=x&annee=3')).toEqual({ measure: 'distincts', corpus: 'chordonomicon', style: null, year: null });
    expect(stateToSearch(readStateFromUrl(''))).toBe('');
  });
});
